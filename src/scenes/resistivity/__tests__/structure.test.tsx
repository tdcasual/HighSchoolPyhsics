import type { ReactNode } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const canvasProps: { current: Record<string, unknown> | null } = { current: null }

vi.mock('../../../scene3d/InteractiveCanvas', () => ({
  InteractiveCanvas: ({ children, frameloop, ...props }: { children: ReactNode; frameloop?: string }) => {
    canvasProps.current = { ...props, frameloop }
    return <div data-testid="interactive-canvas" data-frameloop={frameloop ?? 'always'}>{children}</div>
  },
}))

vi.mock('../ResistivityRig3D', () => ({
  ResistivityRig3D: () => <div data-testid="resistivity-rig" />,
}))

import { ResistivityScene } from '../ResistivityScene'

describe('resistivity structure', () => {
  it('starts on the micrometer and keeps its millimetre camera', () => {
    render(<ResistivityScene />)
    expect(screen.getByRole('heading', { name: '电阻率测量控制' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '测直径' })).toBeInTheDocument()
    expect(screen.getByText('测微器示数')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '全景' })).toHaveAttribute('aria-checked', 'true')
    const chartPanel = screen.getByRole('region', { name: '图表' })
    fireEvent.click(within(chartPanel).getByRole('button', { name: '展开' }))
    expect(screen.getByRole('img', { name: '螺旋测微器读数放大' })).toBeInTheDocument()
    const controls = canvasProps.current?.controls as { maxDistance: number }
    expect(controls.maxDistance).toBeGreaterThanOrEqual(420)
    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'demand')
  })

  it('switches to the circuit camera and runs while the spindle is seating', () => {
    render(<ResistivityScene />)
    fireEvent.click(screen.getByRole('button', { name: '接触金属丝' }))
    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'always')
    fireEvent.click(screen.getByRole('radio', { name: '接电路' }))
    const controls = canvasProps.current?.controls as { maxDistance: number; target: number[] }
    expect(controls.maxDistance).toBeGreaterThanOrEqual(260)
    // The target stays on the circuit; the image is shifted right past the panels instead.
    expect(controls.target).toEqual([0, 3, -1])
    expect((canvasProps.current?.screenOffset as number[])[0]).toBeGreaterThan(0)
  })
})
