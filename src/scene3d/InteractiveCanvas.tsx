import { OrbitControls } from '@react-three/drei/core/OrbitControls'
import { Canvas } from '@react-three/fiber'
import { useMemo, useRef, type ComponentProps, type PropsWithChildren } from 'react'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { buildTouchProfileHint, ENHANCED_TOUCH_PROFILE, findRuntimeTouchProfile } from '../app/touchProfile'
import { useAppStore } from '../store/useAppStore'
import { useMediaQuery } from '../ui/hooks/useMediaQuery'
import { readVec3, type Vec3Tuple } from './cameraSync'
import { CameraSynchronizer } from './CameraSynchronizer'
import { DEMO_ORBIT_CONTROLS } from './cameraControls'
import { resolveCanvasQualityProfile, resolvePerformanceProfile } from './canvasQuality'
import type { PresentationFocus } from './presentationCamera'
import { ProjectionOffset } from './ProjectionOffset'
import { isTestRuntime } from './testRuntime'
import { installThreeConsoleFilter } from './threeConsoleFilter'
import { usePresentationFocus } from './usePresentationFocus'

installThreeConsoleFilter()

type InteractiveCanvasProps = PropsWithChildren<{
  camera: NonNullable<ComponentProps<typeof Canvas>['camera']>
  cameraUp?: Vec3Tuple
  frameloop?: ComponentProps<typeof Canvas>['frameloop']
  controlsEnabled?: boolean
  /** Apply changing camera fit/preset inputs to the live Three.js camera. */
  syncCamera?: boolean
  /**
   * Shift the rendered image by [x, y] CSS px so the orbit target shows at the centre of the
   * area the panels leave free (from useFittedOrbitCamera / FittedCanvas).
   */
  screenOffset?: [number, number]
  controls?: Partial<Omit<ComponentProps<typeof OrbitControls>, 'makeDefault' | 'enabled'>>
  presentationFocus?: PresentationFocus
  presentationLockMs?: number
}>

/**
 * The animation zone every scene renders into: the R3F canvas, OrbitControls with presentation
 * focus (usePresentationFocus), camera sync for fitted views (CameraSynchronizer), the
 * projection shift that centres the composition in the free area (screenOffset), quality
 * settings and the gesture hint. Scenes reach it through FittedCanvas or useFittedOrbitCamera.
 */
export function InteractiveCanvas({
  camera,
  cameraUp,
  frameloop = 'always',
  controlsEnabled = true,
  syncCamera = false,
  screenOffset,
  controls,
  presentationFocus,
  presentationLockMs = 4500,
  children,
}: InteractiveCanvasProps) {
  const activeScenePath = useAppStore((state) => state.activeScenePath)
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  // Lecture mode hides every overlay, so the composition goes back to the canvas center.
  const presenting = useAppStore((state) => state.presenting)
  const { onChange: controlsOnChange, onStart: controlsOnStart, ...controlsProps } = controls ?? {}
  const targetProp = controls?.target
  const targetValues = readVec3(targetProp)
  const targetKey = targetValues?.map((value) => value.toFixed(4)).join(',') ?? 'default'
  const touchProfile = useMemo(
    () => findRuntimeTouchProfile(activeScenePath) ?? ENHANCED_TOUCH_PROFILE,
    [activeScenePath],
  )
  const cameraConfig = camera as unknown as { position?: unknown; fov?: number; near?: number; far?: number; zoom?: number }
  const cameraPosition = readVec3(cameraConfig.position)
  const cameraSyncKey = [cameraPosition?.join(',') ?? 'none', cameraUp?.join(',') ?? 'default-up', cameraConfig.fov, cameraConfig.near, cameraConfig.far, cameraConfig.zoom].join(':')
  const orbit = usePresentationFocus({
    controlsRef,
    presentationFocus,
    presentationLockMs,
    controlsOnStart: controlsOnStart as ((event?: unknown) => void) | undefined,
    controlsOnChange: controlsOnChange as ((event?: unknown) => void) | undefined,
  })
  const quality = useMemo(() => resolveCanvasQualityProfile(), [])
  const shadowsEnabled = resolvePerformanceProfile().shadowMapSize !== null

  const touchOnly = useMediaQuery('(hover: none) and (pointer: coarse)')
  const hint = useMemo(
    () => buildTouchProfileHint(touchProfile, { pointer: touchOnly ? 'touch' : 'any' }),
    [touchProfile, touchOnly],
  )

  if (isTestRuntime()) {
    return (
      <div
        className="canvas-fallback-stack"
        data-testid="interactive-canvas"
        data-frameloop={frameloop}
        data-presentation-focus-mode={orbit.focusMode}
        data-canvas-gesture-scope={touchProfile.canvasGestureScope}
      >
        <div className="canvas-fallback">3D演示预览（测试环境占位）</div>
        <p className="interaction-hint">{hint}</p>
      </div>
    )
  }

  return (
    <div
      className="interactive-canvas"
      role="img"
      aria-label="3D 物理模拟场景，支持鼠标拖拽旋转、滚轮缩放"
      aria-roledescription="3D 交互场景"
      data-presentation-focus-mode={orbit.focusMode}
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
          {syncCamera ? <CameraSynchronizer camera={camera} cameraUp={cameraUp} target={targetProp} controlsRef={controlsRef} cameraKey={cameraSyncKey} targetKey={targetKey} /> : null}
          <OrbitControls
            ref={controlsRef}
            makeDefault
            enabled={controlsEnabled}
            {...DEMO_ORBIT_CONTROLS}
            {...controlsProps}
            onStart={orbit.onStart}
            onChange={orbit.onChange}
          />
        </Canvas>
      </div>
      <p className="interaction-hint">{hint}</p>
    </div>
  )
}
