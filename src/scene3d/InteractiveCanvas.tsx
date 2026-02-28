import { OrbitControls } from '@react-three/drei/core/OrbitControls'
import { Canvas } from '@react-three/fiber'
import {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
  type ComponentProps,
  type PointerEvent,
  type PropsWithChildren,
} from 'react'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { DEMO_ORBIT_CONTROLS } from './cameraControls'
import { TOUCH_MODE_LABELS, type TouchMode } from './gestureMapper'
import { createTouchInteractionKernel } from './touchInteractionKernel'
import { installThreeConsoleFilter } from './threeConsoleFilter'
import { resolveCanvasQualityProfile } from './canvasQuality'
import { isWebGLSupportedInBrowser } from './webglSupport'
import {
  DEFAULT_ADAPTIVE_FRAMING,
  resolveAdaptiveFramingTarget,
  type AdaptiveFramingOptions,
} from './adaptiveFraming'

installThreeConsoleFilter()

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
  const [touchMode, setTouchMode] = useState<TouchMode>('inspect')
  const [resetVersion, setResetVersion] = useState(0)
  const [touchFeedback, setTouchFeedback] = useState('')
  const [feedbackVersion, setFeedbackVersion] = useState(0)
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

  const showTouchFeedback = useCallback((message: string) => {
    setTouchFeedback(message)
    setFeedbackVersion((version) => version + 1)
  }, [])

  useEffect(() => {
    if (resetVersion === 0) {
      return
    }
    controlsRef.current?.reset()
  }, [resetVersion])

  useEffect(() => {
    if (!touchFeedback) {
      return
    }
    const timerId = window.setTimeout(() => {
      setTouchFeedback('')
    }, 900)
    return () => window.clearTimeout(timerId)
  }, [touchFeedback, feedbackVersion])

  useEffect(() => {
    adaptiveBaseTargetRef.current = null
    adaptiveZoomStartDistanceRef.current = null
    previousDistanceRef.current = null
    adaptiveInternalChangeRef.current = false
  }, [targetKey])

  const touchKernel = useMemo(
    () =>
      createTouchInteractionKernel({
        initialMode: 'inspect',
        onAction: (action) => {
          if (action.type === 'double_tap_reset') {
            setResetVersion((version) => version + 1)
            showTouchFeedback('已重置视角')
            return
          }
          if (action.type === 'mode_switch') {
            setTouchMode(action.mode)
            showTouchFeedback(`已切换${TOUCH_MODE_LABELS[action.mode]}`)
          }
        },
      }),
    [showTouchFeedback],
  )
  const quality = useMemo(() => resolveCanvasQualityProfile(), [])
  const webglSupported = useMemo(() => isWebGLSupportedInBrowser(), [])

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    touchKernel.onPointerDown(event.nativeEvent)
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    touchKernel.onPointerMove(event.nativeEvent)
  }

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    touchKernel.onPointerUp(event.nativeEvent)
  }

  const handlePointerCancel = (event: PointerEvent<HTMLDivElement>) => {
    touchKernel.onPointerCancel(event.nativeEvent)
  }

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

  const hint = `拖拽旋转 · 滚轮缩放 · 右键平移 · 单指旋转 · 双指缩放/平移 · 双击（触屏）重置 · 三指切换模式（${TOUCH_MODE_LABELS[touchMode]}）`

  if (!webglSupported) {
    return (
      <div className="canvas-fallback-stack">
        <div className="canvas-fallback">3D演示预览（测试环境降级）</div>
        <p className="interaction-hint">{hint}</p>
      </div>
    )
  }

  return (
    <div className="interactive-canvas">
      <div
        className="interactive-canvas-surface"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
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
            enablePan={touchMode === 'inspect'}
          />
        </Canvas>
      </div>
      <p className="interaction-hint" aria-live="polite">
        {hint}
        {touchFeedback ? <span className="interaction-feedback"> · {touchFeedback}</span> : null}
      </p>
    </div>
  )
}
