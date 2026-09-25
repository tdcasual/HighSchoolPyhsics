import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
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
    expect(screen.getByRole('img', { name: '游标卡尺读数放大' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '拆开' })).toBeInTheDocument()
    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'demand')
    expect(screen.getByTestId('measuring-tools-rig')).toBeInTheDocument()

    const camera = canvasProps.current?.camera as { fov: number; position: number[] }
    const controls = canvasProps.current?.controls as { maxDistance: number; minDistance: number; target: number[] }
    expect(canvasProps.current?.adaptiveFraming).toBe(false)
    expect(camera.fov).toBe(26)
    expect(controls.minDistance).toBe(70)
    expect(controls.maxDistance).toBe(950)
    expect(controls.target).toEqual([95, -4, 0])
    expect(camera.position[1]).toBeGreaterThan(40)
  })

  it('switches the reading strip and camera budget when the micrometer is selected', () => {
    render(<MeasuringToolsScene />)
    fireEvent.click(screen.getByRole('radio', { name: '螺旋测微器' }))

    expect(screen.getByRole('img', { name: '螺旋测微器读数放大' })).toBeInTheDocument()
    const controls = canvasProps.current?.controls as { maxDistance: number; minDistance: number }
    expect(controls.minDistance).toBe(40)
    expect(controls.maxDistance).toBe(420)
  })

  it('runs the frameloop while a commanded reading is easing into place', () => {
    render(<MeasuringToolsScene />)
    fireEvent.click(screen.getByRole('button', { name: '调到该读数' }))
    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'always')
  })
})
