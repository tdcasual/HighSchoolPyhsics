import { OrbitControls } from '@react-three/drei/core/OrbitControls'
import { Canvas, useThree } from '@react-three/fiber'
import { useAppStore } from '../store/useAppStore'
import { buildTouchProfileHint, ENHANCED_TOUCH_PROFILE, findRuntimeTouchProfile } from '../app/touchProfile'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, type ComponentProps, type PropsWithChildren, type RefObject } from 'react'
import type { Camera, PerspectiveCamera } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { DEMO_ORBIT_CONTROLS } from './cameraControls'
import { useMediaQuery } from '../ui/hooks/useMediaQuery'
import { installThreeConsoleFilter } from './threeConsoleFilter'
import { ProjectionOffset } from './ProjectionOffset'
import { resolveSafeAreaTransform, type SafeAreaOptions } from './safeArea'
import { useOverlayObstacles } from './useOverlayObstacles'
import { resolveCanvasQualityProfile, resolvePerformanceProfile } from './canvasQuality'
import { DEFAULT_ADAPTIVE_FRAMING, resolveAdaptiveFramingTarget, type AdaptiveFramingOptions } from './adaptiveFraming'
import {
  resolvePresentationCameraDistanceHint,
  resolvePresentationCameraTarget,
  type PresentationFocus,
} from './presentationCamera'

installThreeConsoleFilter()

const OVERVIEW_PRESENTATION_FOCUS: PresentationFocus = { mode: 'overview' }


type Vec3Tuple = [number, number, number]

type CameraSyncConfig = {
  position?: unknown
  fov?: number
  near?: number
  far?: number
  zoom?: number
}

function readVec3(value: unknown): Vec3Tuple | undefined {
  if (Array.isArray(value) && value.length >= 3) {
    return [Number(value[0]), Number(value[1]), Number(value[2])]
  }
  if (value && typeof value === 'object' && 'x' in value && 'y' in value && 'z' in value) {
    const vector = value as { x: number; y: number; z: number }
    return [vector.x, vector.y, vector.z]
  }
  return undefined
}

function synchronizeCamera(
  activeCamera: Camera,
  config: CameraSyncConfig,
  targetPosition: Vec3Tuple | undefined,
  controlsRef: RefObject<OrbitControlsImpl | null>,
  cameraUp?: Vec3Tuple,
) {
  const position = readVec3(config.position)
  if (position) activeCamera.position.set(...position)
  if (cameraUp) activeCamera.up.set(...cameraUp)
  const perspectiveCamera = activeCamera as PerspectiveCamera
  if (typeof config.fov === 'number') perspectiveCamera.fov = config.fov
  if (typeof config.near === 'number') perspectiveCamera.near = config.near
  if (typeof config.far === 'number') perspectiveCamera.far = config.far
  if (typeof config.zoom === 'number') perspectiveCamera.zoom = config.zoom
  perspectiveCamera.updateProjectionMatrix()

  if (targetPosition) {
    const controls = controlsRef.current
    if (controls) {
      controls.target.set(...targetPosition)
      controls.update()
    } else {
      activeCamera.lookAt(...targetPosition)
    }
  }
}

function CameraSynchronizer({
  camera,
  cameraUp,
  target,
  controlsRef,
  cameraKey,
  targetKey,
}: {
  camera: NonNullable<ComponentProps<typeof Canvas>['camera']>
  cameraUp?: Vec3Tuple
  target: ComponentProps<typeof OrbitControls>['target']
  controlsRef: RefObject<OrbitControlsImpl | null>
  cameraKey: string
  targetKey: string
}) {
  const activeCamera = useThree((state) => state.camera)
  const invalidate = useThree((state) => state.invalidate)
  const cameraRef = useRef(camera)
  const cameraUpRef = useRef(cameraUp)
  const targetRef = useRef(target)

  useLayoutEffect(() => {
    cameraRef.current = camera
    cameraUpRef.current = cameraUp
    targetRef.current = target
  })

  useLayoutEffect(() => {
    synchronizeCamera(
      activeCamera,
      cameraRef.current as unknown as CameraSyncConfig,
      readVec3(targetRef.current),
      controlsRef,
      cameraUpRef.current,
    )
    invalidate()
  }, [activeCamera, cameraKey, controlsRef, invalidate, targetKey])

  return null
}

function isTestRuntime(): boolean {
  const viteEnv = (import.meta as { env?: Record<string, unknown> }).env
  return Boolean(viteEnv && (viteEnv.MODE === 'test' || viteEnv.VITEST === true))
}

type InteractiveCanvasProps = PropsWithChildren<{
  camera: NonNullable<ComponentProps<typeof Canvas>['camera']>
  cameraUp?: Vec3Tuple
  frameloop?: ComponentProps<typeof Canvas>['frameloop']
  controlsEnabled?: boolean
  /** Apply changing camera fit/preset inputs to the live Three.js camera. */
  syncCamera?: boolean
  /** Shift the rendered image by [x, y] CSS px so the orbit target shows off-center. */
  screenOffset?: [number, number]
  /**
   * Fit the composition into the area right of the sidebar and panel column (sampled when the
   * scene opens, so later panel changes only cover the view). Ignored when `screenOffset` is set.
   */
  safeArea?: boolean | SafeAreaOptions
  controls?: Partial<Omit<ComponentProps<typeof OrbitControls>, 'makeDefault' | 'enabled'>>
  adaptiveFraming?: boolean | Partial<AdaptiveFramingOptions>
  presentationFocus?: PresentationFocus
  presentationLockMs?: number
}>

export function InteractiveCanvas({
  camera,
  cameraUp,
  frameloop = 'always',
  controlsEnabled = true,
  syncCamera = false,
  screenOffset,
  safeArea = true,
  controls,
  adaptiveFraming = true,
  presentationFocus,
  presentationLockMs = 4500,
  children,
}: InteractiveCanvasProps) {
  const activeScenePath = useAppStore((state) => state.activeScenePath)
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const overlays = useOverlayObstacles(rootRef)
  // Lecture mode hides every overlay, so the composition goes back to the canvas center.
  const presenting = useAppStore((state) => state.presenting)
  const safeAreaTransform = presenting || screenOffset || safeArea === false
    ? null
    : resolveSafeAreaTransform({ width: overlays.width, obstacles: overlays.obstacles, options: safeArea === true ? undefined : safeArea })
  const adaptiveBaseTargetRef = useRef<{
    x: number
    y: number
    z: number
  } | null>(null)
  const adaptiveZoomStartDistanceRef = useRef<number | null>(null)
  const previousDistanceRef = useRef<number | null>(null)
  const adaptiveInternalChangeRef = useRef(false)
  const presentationLockUntilRef = useRef(0)
  const { onChange: controlsOnChange, onStart: controlsOnStart, ...controlsProps } = controls ?? {}
  const targetProp = controls?.target
  const targetValues = readVec3(targetProp)
  const targetKey = targetValues?.map((value) => value.toFixed(4)).join(',') ?? 'default'
  const touchProfile = useMemo(
    () => findRuntimeTouchProfile(activeScenePath) ?? ENHANCED_TOUCH_PROFILE,
    [activeScenePath],
  )
  const resolvedPresentationFocus = presentationFocus ?? OVERVIEW_PRESENTATION_FOCUS
  const presentationFocusKey = resolvedPresentationFocus
    ? `${resolvedPresentationFocus.mode}:${resolvedPresentationFocus.primary?.join(',') ?? 'none'}:${resolvedPresentationFocus.secondary?.join(',') ?? 'none'}`
    : 'none'
  const cameraConfig = camera as unknown as { position?: unknown; fov?: number; near?: number; far?: number; zoom?: number }
  const cameraPosition = readVec3(cameraConfig.position)
  const cameraSyncKey = [cameraPosition?.join(',') ?? 'none', cameraUp?.join(',') ?? 'default-up', cameraConfig.fov, cameraConfig.near, cameraConfig.far, cameraConfig.zoom].join(':')
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

  const quality = useMemo(() => resolveCanvasQualityProfile(), [])
  const shadowsEnabled = resolvePerformanceProfile().shadowMapSize !== null

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

  const touchOnly = useMediaQuery('(hover: none) and (pointer: coarse)')
  const hint = useMemo(
    () => buildTouchProfileHint(touchProfile, { pointer: touchOnly ? 'touch' : 'any' }),
    [touchProfile, touchOnly],
  )

  if (isTestRuntime()) {
    return (
      <div
        className="canvas-fallback-stack"
        data-presentation-focus-mode={resolvedPresentationFocus?.mode ?? 'overview'}
        data-canvas-gesture-scope={touchProfile.canvasGestureScope}
      >
        <div className="canvas-fallback">3D演示预览（测试环境占位）</div>
        <p className="interaction-hint">{hint}</p>
      </div>
    )
  }

  return (
    <div
      ref={rootRef}
      className="interactive-canvas"
      role="img"
      aria-label="3D 物理模拟场景，支持鼠标拖拽旋转、滚轮缩放"
      aria-roledescription="3D 交互场景"
      data-presentation-focus-mode={resolvedPresentationFocus?.mode ?? 'overview'}
      data-canvas-gesture-scope={touchProfile.canvasGestureScope}
    >
      <div className="interactive-canvas-surface" data-canvas-gesture-scope={touchProfile.canvasGestureScope}>
        <Canvas
          camera={camera}
          frameloop={frameloop}
          dpr={quality.dpr}
          gl={{
            antialias: quality.antialias,
            powerPreference: 'high-performance',
          }}
          performance={{ min: 0.5, debounce: 250 }}
          shadows={shadowsEnabled ? 'percentage' : false}
        >
          {children}
          {screenOffset && !presenting ? <ProjectionOffset x={screenOffset[0]} y={screenOffset[1]} /> : null}
          {safeAreaTransform ? <ProjectionOffset {...safeAreaTransform} /> : null}
          {syncCamera ? <CameraSynchronizer camera={camera} cameraUp={cameraUp} target={targetProp} controlsRef={controlsRef} cameraKey={cameraSyncKey} targetKey={targetKey} /> : null}
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
