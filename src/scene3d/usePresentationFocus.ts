import { useCallback, useEffect, useRef, type RefObject } from 'react'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { resolvePresentationCameraTarget, type PresentationFocus } from './presentationCamera'
import { isTestRuntime } from './testRuntime'

const OVERVIEW: PresentationFocus = { mode: 'overview' }

type OrbitEventHandler = (event?: unknown) => void

/**
 * Presentation focus layered on OrbitControls: when the scene highlights something (the
 * particle in the gap, the probe point) the orbit target eases toward it, except for
 * `presentationLockMs` after the teacher last touched the view. Returns the onStart/onChange
 * handlers for OrbitControls.
 */
export function usePresentationFocus(options: {
  controlsRef: RefObject<OrbitControlsImpl | null>
  presentationFocus?: PresentationFocus
  presentationLockMs: number
  controlsOnStart?: OrbitEventHandler
  controlsOnChange?: OrbitEventHandler
}) {
  const { controlsRef, presentationLockMs, controlsOnStart, controlsOnChange } = options
  const focus = options.presentationFocus ?? OVERVIEW
  const lockUntilRef = useRef(0)
  const focusKey = `${focus.mode}:${focus.primary?.join(',') ?? 'none'}:${focus.secondary?.join(',') ?? 'none'}`

  useEffect(() => {
    if (isTestRuntime()) return
    const frame = window.requestAnimationFrame(() => {
      const orbit = controlsRef.current
      if (!orbit || Date.now() < lockUntilRef.current) return
      const next = resolvePresentationCameraTarget({ baseTarget: orbit.target, ...focus })
      const changed =
        Math.abs(orbit.target.x - next.x) > 1e-4 ||
        Math.abs(orbit.target.y - next.y) > 1e-4 ||
        Math.abs(orbit.target.z - next.z) > 1e-4
      if (!changed) return
      orbit.target.set(next.x, next.y, next.z)
      orbit.update()
    })
    return () => window.cancelAnimationFrame(frame)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- focusKey serializes focus
  }, [focusKey])

  const onStart = useCallback(
    (event?: unknown) => {
      lockUntilRef.current = Date.now() + presentationLockMs
      controlsOnStart?.(event)
    },
    [controlsOnStart, presentationLockMs],
  )

  return { focusMode: focus.mode, onStart, onChange: controlsOnChange }
}
