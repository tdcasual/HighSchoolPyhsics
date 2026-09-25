import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const canvasProps: { current: Record<string, unknown> | null } = { current: null }

vi.mock('../../../scene3d/InteractiveCanvas', () => ({
  InteractiveCanvas: ({ children, ...props }: { children: ReactNode }) => {
    canvasProps.current = props
    return <div data-testid="interactive-canvas">{children}</div>
  },
}))

vi.mock('../MeterAssembly', () => ({
  MeterAssembly: () => <div data-testid="multimeter-rig" />,
}))

import { MultimeterScene } from '../MultimeterScene'

describe('multimeter structure', () => {
  it('opens on the meter with the reference camera budget', () => {
    render(<MultimeterScene />)
    expect(screen.getByRole('heading', { name: '多用电表控制' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '使用' })).toBeInTheDocument()
    expect(screen.getByLabelText('挡位')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '多用电表读数' })).toBeInTheDocument()
    expect(screen.getByTestId('multimeter-rig')).toBeInTheDocument()
    const camera = canvasProps.current?.camera as { fov: number }
    const controls = canvasProps.current?.controls as { maxDistance: number; minDistance: number; target: number[] }
    expect(camera.fov).toBe(30)
    expect(controls.minDistance).toBe(18)
    expect(controls.maxDistance).toBe(140)
    expect(controls.target).toEqual([0, 6, 6])
    expect(canvasProps.current?.adaptiveFraming).toBe(false)
  })

  it('swaps the probe label and shows the connection-error chart', () => {
    render(<MultimeterScene />)
    fireEvent.click(screen.getByRole('button', { name: '对调表笔' }))
    expect(screen.getByText('红黑已对调')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: '内外接' }))
    expect(screen.getByRole('img', { name: '内外接误差' })).toBeInTheDocument()
  })
})
