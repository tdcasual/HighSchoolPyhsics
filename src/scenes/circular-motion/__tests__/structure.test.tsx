import type { ReactNode } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../scene3d/InteractiveCanvas', () => ({
  InteractiveCanvas: ({ children, frameloop }: { children: ReactNode; frameloop?: string }) => (
    <div data-testid="interactive-canvas" data-frameloop={frameloop}>{children}</div>
  ),
}))
vi.mock('../CircularMotionRig3D', () => ({ CircularMotionRig3D: () => <div data-testid="circular-rig" /> }))

import { CircularMotionScene } from '../CircularMotionScene'

describe('circular-motion structure', () => {
  it('turntable: shows v, aₙ and whether friction can hold the block', () => {
    render(<CircularMotionScene />)
    const data = within(screen.getByRole('region', { name: '数据' }))
    // m = 0.2 kg, r = 0.3 m, ω = 3 rad/s: v = 0.9 m/s, aₙ = 2.7 m/s², Fₙ = 0.54 N < μmg = 0.78 N
    expect(data.getByText('0.90 m/s · 2.09 s')).toBeInTheDocument()
    expect(data.getByText('2.70 m/s²')).toBeInTheDocument()
    expect(data.getByText('随转盘一起转动')).toBeInTheDocument()

    const omega = screen.getByRole('slider', { name: /角速度 ω/ })
    fireEvent.change(omega, { target: { value: '6' } })
    fireEvent.pointerUp(omega) // RangeField flushes its frame-throttled change on release
    expect(data.getByText('滑离转盘（离心运动）')).toBeInTheDocument()
  })

  it('conical pendulum: angle and tension follow cosθ = g/(ω²L)', () => {
    render(<CircularMotionScene />)
    fireEvent.click(screen.getByRole('radio', { name: '圆锥摆' }))
    const data = within(screen.getByRole('region', { name: '数据' }))
    // L = 1 m, ω = 4 rad/s: cosθ = 9.8/16 → θ ≈ 52.2°, F拉 = mω²L = 1.6 N
    expect(data.getByText('52.2°')).toBeInTheDocument()
    expect(data.getByText('1.600 N')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '单步 15°' }))
    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'demand')
  })
})
