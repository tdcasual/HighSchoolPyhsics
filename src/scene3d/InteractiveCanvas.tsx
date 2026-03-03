import { OrbitControls } from '@react-three/drei/core/OrbitControls'
import { Canvas } from '@react-three/fiber'
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

installThreeConsoleFilter()

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
}>

export function InteractiveCanvas({
  camera,
  frameloop = 'always',
  controlsEnabled = true,
  controls,
  adaptiveFraming = true,
  children,
}: InteractiveCanvasProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const adaptiveBaseTargetRef = useRef<{ x: number; y: number; z: number } | null>(null)
  const adaptiveZoomStartDistanceRef = useRef<number | null>(null)
  const previousDistanceRef = useRef<number | null>(null)
  const adaptiveInternalChangeRef = useRef(false)
  const { onChange: controlsOnChange, ...controlsProps } = controls ?? {}
  const targetProp = controls?.target
  const targetKey =
    Array.isArray(targetProp) && targetProp.length === 3
      ? targetProp.map((value) => Number(value).toFixed(4)).join(',')
      : 'default'
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
  }, [targetKey])

  const quality = useMemo(() => resolveCanvasQualityProfile(), [])

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

      const nextTarget = resolveAdaptiveFramingTarget({
        baseTarget: adaptiveBaseTargetRef.current,
        distance,
        zoomStartDistance,
        zoomEndDistance,
        zoomInEndDistance,
        shiftX: adaptiveFramingOptions.shiftX,
        shiftY: adaptiveFramingOptions.shiftY,
        zoomInShiftX: adaptiveFramingOptions.zoomInShiftX,
        zoomInShiftY: adaptiveFramingOptions.zoomInShiftY,
      })

      if (
        Math.abs(orbit.target.x - nextTarget.x) <= 1e-4 &&
        Math.abs(orbit.target.y - nextTarget.y) <= 1e-4 &&
        Math.abs(orbit.target.z - nextTarget.z) <= 1e-4
      ) {
        return
      }

      adaptiveInternalChangeRef.current = true
      orbit.target.set(nextTarget.x, nextTarget.y, nextTarget.z)
      orbit.update()
    },
    [adaptiveFramingOptions, controlsOnChange],
  )

  const hint = '拖拽旋转 · 滚轮缩放 · 右键平移 · 单指旋转 · 双指缩放/平移'

  if (isTestRuntime()) {
    return (
      <div className="canvas-fallback-stack">
        <div className="canvas-fallback">3D演示预览（测试环境占位）</div>
        <p className="interaction-hint">{hint}</p>
      </div>
    )
  }

  return (
    <div className="interactive-canvas">
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
            onChange={handleOrbitControlsChange}
          />
        </Canvas>
      </div>
      <p className="interaction-hint">{hint}</p>
    </div>
  )
}
