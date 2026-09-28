import type { ReactNode } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const canvasProps: { current: Record<string, unknown> | null } = { current: null }

vi.mock('../../../scene3d/InteractiveCanvas', () => ({
  InteractiveCanvas: ({
    children,
    frameloop,
    ...props
  }: {
    children: ReactNode
    frameloop?: 'always' | 'demand'
  }) => {
    canvasProps.current = { ...props, frameloop }
    return (
      <div data-testid="interactive-canvas" data-frameloop={frameloop ?? 'always'}>
        {children}
      </div>
    )
  },
}))

vi.mock('../MeasuringToolsRig3D', () => ({
  MeasuringToolsRig3D: () => <div data-testid="measuring-tools-rig" />,
}))

import { MeasuringToolsScene } from '../MeasuringToolsScene'

describe('measuring-tools structure', () => {
  it('keeps the reference camera limits so the millimetre instrument is not clamped', () => {
    render(<MeasuringToolsScene />)

    expect(screen.getByRole('heading', { name: '测量工具控制' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '游标卡尺' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '螺旋测微器' })).toBeInTheDocument()
    expect(screen.getByText('示数')).toBeInTheDocument()
    const chartPanel = screen.getByRole('region', { name: '图表' })
    expect(within(chartPanel).queryByRole('img', { name: '游标卡尺读数放大' })).not.toBeInTheDocument()
    fireEvent.click(within(chartPanel).getByRole('button', { name: '展开' }))
    expect(within(chartPanel).getByRole('img', { name: '游标卡尺读数放大' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '拆开' })).toBeInTheDocument()
    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'demand')
    expect(screen.getByTestId('measuring-tools-rig')).toBeInTheDocument()

    const camera = canvasProps.current?.camera as { fov: number; position: number[] }
    const controls = canvasProps.current?.controls as { maxDistance: number; minDistance: number; target: number[] }
    expect(canvasProps.current?.adaptiveFraming).toBe(false)
    expect(canvasProps.current?.syncCamera).toBe(true)
    expect(camera.fov).toBe(26)
    expect(controls.minDistance).toBe(70)
    const radius = Math.hypot(
      camera.position[0] - controls.target[0],
      camera.position[1] - controls.target[1],
      camera.position[2] - controls.target[2],
    )
    expect(controls.maxDistance).toBeGreaterThan(radius * 1.19)
    expect(controls.target.every(Number.isFinite)).toBe(true)
    expect(controls.target[0]).toBeLessThan(95)
    expect(camera.position[1]).toBeGreaterThan(40)
  })

  it('switches the reading strip and camera budget when the micrometer is selected', () => {
    render(<MeasuringToolsScene />)
    fireEvent.click(screen.getByRole('radio', { name: '螺旋测微器' }))

    const chartPanel = screen.getByRole('region', { name: '图表' })
    fireEvent.click(within(chartPanel).getByRole('button', { name: '展开' }))
    expect(within(chartPanel).getByRole('img', { name: '螺旋测微器读数放大' })).toBeInTheDocument()
    const camera = canvasProps.current?.camera as { position: number[] }
    const controls = canvasProps.current?.controls as { maxDistance: number; minDistance: number; target: number[] }
    const radius = Math.hypot(
      camera.position[0] - controls.target[0],
      camera.position[1] - controls.target[1],
      camera.position[2] - controls.target[2],
    )
    expect(controls.minDistance).toBe(40)
    expect(controls.maxDistance).toBeGreaterThan(radius * 1.19)
  })

  it('updates the fitted camera when the view preset changes', () => {
    render(<MeasuringToolsScene />)
    const initial = canvasProps.current?.camera as { position: number[] }
    const initialPosition = [...initial.position]

    fireEvent.click(screen.getByRole('radio', { name: '俯视' }))

    const topView = canvasProps.current?.camera as { position: number[] }
    expect(topView.position).not.toEqual(initialPosition)
    expect(canvasProps.current?.syncCamera).toBe(true)
  })

  it('runs the frameloop while a commanded reading is easing into place', () => {
    render(<MeasuringToolsScene />)
    fireEvent.click(screen.getByRole('button', { name: '调到该读数' }))
    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'always')
  })
})
