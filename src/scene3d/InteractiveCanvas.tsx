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

installThreeConsoleFilter()

type InteractiveCanvasProps = PropsWithChildren<{
  camera: NonNullable<ComponentProps<typeof Canvas>['camera']>
  controlsEnabled?: boolean
  controls?: Partial<
    Omit<ComponentProps<typeof OrbitControls>, 'makeDefault' | 'enabled'>
  >
}>

export function InteractiveCanvas({
  camera,
  controlsEnabled = true,
  controls,
  children,
}: InteractiveCanvasProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const [touchMode, setTouchMode] = useState<TouchMode>('inspect')
  const [resetVersion, setResetVersion] = useState(0)
  const [touchFeedback, setTouchFeedback] = useState('')
  const [feedbackVersion, setFeedbackVersion] = useState(0)

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

  const hint = `拖拽旋转 · 滚轮缩放 · 右键平移 · 单指旋转 · 双指缩放/平移 · 双击重置 · 三指切换模式（${TOUCH_MODE_LABELS[touchMode]}）`

  if (typeof window === 'undefined' || !('WebGLRenderingContext' in window)) {
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
        <Canvas camera={camera}>
          {children}
          <OrbitControls
            ref={controlsRef}
            makeDefault
            enabled={controlsEnabled}
            {...DEMO_ORBIT_CONTROLS}
            {...controls}
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
