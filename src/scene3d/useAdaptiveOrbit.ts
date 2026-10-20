import { useCallback, useEffect, useMemo, useRef, type RefObject } from 'react'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { DEFAULT_ADAPTIVE_FRAMING, resolveAdaptiveFramingTarget, type AdaptiveFramingOptions } from './adaptiveFraming'
import {
  resolvePresentationCameraDistanceHint,
  resolvePresentationCameraTarget,
  type PresentationFocus,
} from './presentationCamera'
import { isTestRuntime } from './testRuntime'

const OVERVIEW_PRESENTATION_FOCUS: PresentationFocus = { mode: 'overview' }

type OrbitEventHandler = (event?: unknown) => void

/**
 * Orbit behaviour layered on OrbitControls: adaptive framing (the target drifts with zoom so
 * the subject stays in view) and presentation focus (the target eases to what the scene
 * highlights, paused for `presentationLockMs` after the teacher touches the view). Returns the
 * onStart/onChange handlers for OrbitControls.
 */
export function useAdaptiveOrbit(options: {
  controlsRef: RefObject<OrbitControlsImpl | null>
  adaptiveFraming: boolean | Partial<AdaptiveFramingOptions>
  presentationFocus?: PresentationFocus
  presentationLockMs: number
  /** Changes when the scene moves the orbit target; adaptive framing restarts from it. */
  targetKey: string
  controlsOnStart?: OrbitEventHandler
  controlsOnChange?: OrbitEventHandler
}) {
  const { controlsRef, adaptiveFraming, presentationFocus, presentationLockMs, targetKey, controlsOnStart, controlsOnChange } = options
  const adaptiveBaseTargetRef = useRef<{
    x: number
    y: number
    z: number
  } | null>(null)
  const adaptiveZoomStartDistanceRef = useRef<number | null>(null)
  const previousDistanceRef = useRef<number | null>(null)
  const adaptiveInternalChangeRef = useRef(false)
  const presentationLockUntilRef = useRef(0)
  const resolvedPresentationFocus = presentationFocus ?? OVERVIEW_PRESENTATION_FOCUS
  const presentationFocusKey = resolvedPresentationFocus
    ? `${resolvedPresentationFocus.mode}:${resolvedPresentationFocus.primary?.join(',') ?? 'none'}:${resolvedPresentationFocus.secondary?.join(',') ?? 'none'}`
    : 'none'
  const adaptiveFramingOptions = useMemo(() => {
    if (adaptiveFraming === false) {
      return null
    }
    if (adaptiveFraming === true) {
      return DEFAULT_ADAPTIVE_FRAMING
    }
    return {
      ...DEFAULT_ADAPTIVE_FRAMING,
      ...adaptiveFraming,
    }
  }, [adaptiveFraming])

  useEffect(() => {
    adaptiveBaseTargetRef.current = null
    adaptiveZoomStartDistanceRef.current = null
    previousDistanceRef.current = null
    adaptiveInternalChangeRef.current = false
  }, [presentationFocusKey, targetKey])

  useEffect(() => {
    if (!resolvedPresentationFocus || isTestRuntime()) {
      return
    }

    const rafId = window.requestAnimationFrame(() => {
      if (Date.now() < presentationLockUntilRef.current) {
        return
      }

      const orbit = controlsRef.current
      if (!orbit) {
        return
      }

      const baseTarget = {
        x: orbit.target.x,
        y: orbit.target.y,
        z: orbit.target.z,
      }
      const nextTarget = resolvePresentationCameraTarget({
        baseTarget,
        mode: resolvedPresentationFocus.mode,
        primary: resolvedPresentationFocus.primary,
        secondary: resolvedPresentationFocus.secondary,
      })

      const changed =
        Math.abs(orbit.target.x - nextTarget.x) > 1e-4 ||
        Math.abs(orbit.target.y - nextTarget.y) > 1e-4 ||
        Math.abs(orbit.target.z - nextTarget.z) > 1e-4

      if (!changed) {
        return
      }

      adaptiveInternalChangeRef.current = true
      orbit.target.set(nextTarget.x, nextTarget.y, nextTarget.z)
      orbit.update()
    })

    return () => window.cancelAnimationFrame(rafId)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- presentationFocusKey is a stable serialization of resolvedPresentationFocus
  }, [presentationFocusKey])

  const handleOrbitControlsStart = useCallback(
    (event?: unknown) => {
      presentationLockUntilRef.current = Date.now() + presentationLockMs
      controlsOnStart?.(event)
    },
    [controlsOnStart, presentationLockMs],
  )

  const handleOrbitControlsChange = useCallback(
    (event?: unknown) => {
      controlsOnChange?.(event)

      if (!adaptiveFramingOptions || adaptiveInternalChangeRef.current) {
        adaptiveInternalChangeRef.current = false
        return
      }

      const orbit = controlsRef.current
      if (!orbit) {
        return
      }

      const distance = orbit.getDistance()
      if (!Number.isFinite(distance)) {
        return
      }

      if (adaptiveBaseTargetRef.current === null) {
        adaptiveBaseTargetRef.current = {
          x: orbit.target.x,
          y: orbit.target.y,
          z: orbit.target.z,
        }
      }
      if (adaptiveZoomStartDistanceRef.current === null) {
        adaptiveZoomStartDistanceRef.current = distance
      }

      const previousDistance = previousDistanceRef.current
      previousDistanceRef.current = distance
      if (previousDistance !== null && Math.abs(distance - previousDistance) < 1e-4) {
        return
      }

      const zoomStartDistance = adaptiveFramingOptions.zoomStartDistance ?? adaptiveZoomStartDistanceRef.current
      const zoomEndDistance = adaptiveFramingOptions.zoomEndDistance ?? orbit.maxDistance
      const zoomInEndDistance = adaptiveFramingOptions.zoomInEndDistance ?? orbit.minDistance
      if (!Number.isFinite(zoomEndDistance)) {
        return
      }

      const baseTarget = resolvedPresentationFocus
        ? resolvePresentationCameraTarget({
            baseTarget: adaptiveBaseTargetRef.current,
            mode: resolvedPresentationFocus.mode,
            primary: resolvedPresentationFocus.primary,
            secondary: resolvedPresentationFocus.secondary,
          })
        : adaptiveBaseTargetRef.current
      const nextTarget = resolveAdaptiveFramingTarget({
        baseTarget,
        distance,
        zoomStartDistance,
        zoomEndDistance,
        zoomInEndDistance,
        shiftX: adaptiveFramingOptions.shiftX,
        shiftY: adaptiveFramingOptions.shiftY,
        zoomInShiftX: adaptiveFramingOptions.zoomInShiftX,
        zoomInShiftY: adaptiveFramingOptions.zoomInShiftY,
      })
      const hintedDistance = resolvedPresentationFocus
        ? resolvePresentationCameraDistanceHint({
            baseDistance: distance,
            mode: resolvedPresentationFocus.mode,
          })
        : distance

      if (
        Math.abs(orbit.target.x - nextTarget.x) <= 1e-4 &&
        Math.abs(orbit.target.y - nextTarget.y) <= 1e-4 &&
        Math.abs(orbit.target.z - nextTarget.z) <= 1e-4 &&
        Math.abs(hintedDistance - distance) <= 1e-3
      ) {
        return
      }

      adaptiveInternalChangeRef.current = true
      orbit.target.set(nextTarget.x, nextTarget.y, nextTarget.z)
      if (Math.abs(hintedDistance - distance) > 1e-3) {
        const zoomRatio = hintedDistance / distance
        if (Number.isFinite(zoomRatio) && zoomRatio > 0) {
          orbit.object.position.sub(orbit.target).multiplyScalar(zoomRatio).add(orbit.target)
        }
      }
      orbit.update()
    },
    [adaptiveFramingOptions, controlsOnChange, resolvedPresentationFocus],
  )

  return {
    focusMode: resolvedPresentationFocus?.mode ?? 'overview',
    onStart: handleOrbitControlsStart,
    onChange: handleOrbitControlsChange,
  }
}
