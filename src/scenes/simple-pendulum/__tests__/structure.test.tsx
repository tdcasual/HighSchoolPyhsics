import type { ReactNode } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../scene3d/InteractiveCanvas', () => ({
  InteractiveCanvas: ({ children, frameloop }: { children: ReactNode; frameloop?: string }) => (
    <div data-testid="interactive-canvas" data-frameloop={frameloop}>{children}</div>
  ),
}))
vi.mock('../SimplePendulumRig3D', () => ({ SimplePendulumRig3D: () => <div data-testid="pendulum-rig" /> }))

import { SimplePendulumScene } from '../SimplePendulumScene'

describe('simple-pendulum structure', () => {
  it('shows T = 2π√(L/g) and measures the period after two swings', () => {
    render(<SimplePendulumScene />)
    const data = within(screen.getByRole('region', { name: '数据' }))
    expect(data.getByText('2.007 s')).toBeInTheDocument()
    expect(data.getByText('摆动两次后显示')).toBeInTheDocument()
    // Quarter-period steps: through the lowest point after one, to the far side after two.
    fireEvent.click(screen.getByRole('button', { name: '单步 T/4' }))
    expect(data.getByText(/· 0\.\d°$|· -0\.\d°$/)).toBeInTheDocument()
    for (let i = 0; i < 11; i++) fireEvent.click(screen.getByRole('button', { name: '单步 T/4' }))
    // Theoretical and measured periods agree at 10°.
    expect(data.getAllByText(/^2\.0\d\d s$/)).toHaveLength(2)
  })

  it('on the Moon the period is longer', () => {
    render(<SimplePendulumScene />)
    fireEvent.click(screen.getByRole('radio', { name: '月球 g = 1.62 m/s²' }))
    // 2π√(1/1.62) ≈ 4.937 s
    expect(within(screen.getByRole('region', { name: '数据' })).getByText('4.937 s')).toBeInTheDocument()
  })
})
