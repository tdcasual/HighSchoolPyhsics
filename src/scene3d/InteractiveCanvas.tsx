import { OrbitControls } from '@react-three/drei/core/OrbitControls'
import { Canvas } from '@react-three/fiber'
import { useAppStore } from '../store/useAppStore'
import { findRuntimeSceneCatalogEntry, resolveSmartFocusEnabled } from '../app/sceneCatalog'
import { findDemoRoute } from '../app/demoRoutes'
import { buildTouchProfileHint, ENHANCED_TOUCH_PROFILE } from '../app/touchProfile'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ComponentProps,
  type PropsWithChildren,
} from 'react'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { DEMO_ORBIT_CONTROLS } from './cameraControls'
import { installThreeConsoleFilter } from './threeConsoleFilter'
import { resolveCanvasQualityProfile } from './canvasQuality'
import {
  DEFAULT_ADAPTIVE_FRAMING,
  resolveAdaptiveFramingTarget,
  type AdaptiveFramingOptions,
} from './adaptiveFraming'
import {
  resolvePresentationCameraDistanceHint,
  resolvePresentationCameraTarget,
  type PresentationFocus,
} from './presentationCamera'

installThreeConsoleFilter()

const OVERVIEW_PRESENTATION_FOCUS: PresentationFocus = { mode: 'overview' }

function isTestRuntime(): boolean {
  const viteEnv = (import.meta as { env?: Record<string, unknown> }).env
  return Boolean(viteEnv && (viteEnv.MODE === 'test' || viteEnv.VITEST === true))
}

type InteractiveCanvasProps = PropsWithChildren<{
  camera: NonNullable<ComponentProps<typeof Canvas>['camera']>
  frameloop?: ComponentProps<typeof Canvas>['frameloop']
  controlsEnabled?: boolean
  controls?: Partial<Omit<ComponentProps<typeof OrbitControls>, 'makeDefault' | 'enabled'>>
  adaptiveFraming?: boolean | Partial<AdaptiveFramingOptions>
  presentationFocus?: PresentationFocus
  presentationLockMs?: number
}>

export function InteractiveCanvas({
  camera,
  frameloop = 'always',
  controlsEnabled = true,
  controls,
  adaptiveFraming = true,
  presentationFocus,
  presentationLockMs = 4500,
  children,
}: InteractiveCanvasProps) {
  const activeScenePath = useAppStore((state) => state.activeScenePath)
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const adaptiveBaseTargetRef = useRef<{ x: number; y: number; z: number } | null>(null)
  const adaptiveZoomStartDistanceRef = useRef<number | null>(null)
  const previousDistanceRef = useRef<number | null>(null)
  const adaptiveInternalChangeRef = useRef(false)
  const presentationLockUntilRef = useRef(0)
  const {
    onChange: controlsOnChange,
    onStart: controlsOnStart,
    ...controlsProps
  } = controls ?? {}
  const targetProp = controls?.target
  const targetKey =
    Array.isArray(targetProp) && targetProp.length === 3
      ? targetProp.map((value) => Number(value).toFixed(4)).join(',')
      : 'default'
  const smartFocusEnabled = useMemo(
    () => resolveSmartFocusEnabled(findRuntimeSceneCatalogEntry(activeScenePath)?.classroom.smartPresentation),
    [activeScenePath],
  )
  const touchProfile = useMemo(
    () => findDemoRoute(typeof window === 'undefined' ? activeScenePath : window.location.pathname)?.touchProfile ?? ENHANCED_TOUCH_PROFILE,
    [activeScenePath],
  )
  const resolvedPresentationFocus = smartFocusEnabled ? presentationFocus : OVERVIEW_PRESENTATION_FOCUS
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
  }, [presentationFocusKey, resolvedPresentationFocus])

  const quality = useMemo(() => resolveCanvasQualityProfile(), [])

  const handleOrbitControlsStart = useCallback(
    (event?: Parameters<NonNullable<typeof controlsOnStart>>[0]) => {
      presentationLockUntilRef.current = Date.now() + presentationLockMs
      controlsOnStart?.(event)
    },
    [controlsOnStart, presentationLockMs],
  )

  const handleOrbitControlsChange = useCallback(
    (event?: Parameters<NonNullable<typeof controlsOnChange>>[0]) => {
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

      const zoomStartDistance =
        adaptiveFramingOptions.zoomStartDistance ?? adaptiveZoomStartDistanceRef.current
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

  const hint = useMemo(() => buildTouchProfileHint(touchProfile), [touchProfile])

  if (isTestRuntime()) {
    return (
      <div className="canvas-fallback-stack" data-presentation-focus-mode={resolvedPresentationFocus?.mode ?? 'overview'}>
        <div className="canvas-fallback">3D演示预览（测试环境占位）</div>
        <p className="interaction-hint">{hint}</p>
      </div>
    )
  }

  return (
    <div className="interactive-canvas" data-presentation-focus-mode={resolvedPresentationFocus?.mode ?? 'overview'}>
      <div className="interactive-canvas-surface">
        <Canvas
          camera={camera}
          frameloop={frameloop}
          dpr={quality.dpr}
          gl={{ antialias: quality.antialias, powerPreference: 'high-performance' }}
          performance={{ min: 0.5, debounce: 250 }}
        >
          {children}
          <OrbitControls
            ref={controlsRef}
            makeDefault
            enabled={controlsEnabled}
            {...DEMO_ORBIT_CONTROLS}
            {...controlsProps}
            onStart={handleOrbitControlsStart}
            onChange={handleOrbitControlsChange}
          />
        </Canvas>
      </div>
      <p className="interaction-hint">{hint}</p>
    </div>
  )
}
