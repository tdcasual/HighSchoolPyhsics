import { OrbitControls } from '@react-three/drei/core/OrbitControls'
import { Canvas } from '@react-three/fiber'
import type { ComponentProps, PropsWithChildren } from 'react'
import { DEMO_ORBIT_CONTROLS } from './cameraControls'
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
  const hint = '拖拽旋转 · 滚轮缩放 · 右键平移'

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
      <Canvas camera={camera}>
        {children}
        <OrbitControls makeDefault enabled={controlsEnabled} {...DEMO_ORBIT_CONTROLS} {...controls} />
      </Canvas>
      <p className="interaction-hint">{hint}</p>
    </div>
  )
}
