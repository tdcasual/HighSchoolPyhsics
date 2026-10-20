import type { ReactNode } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../scene3d/InteractiveCanvas', () => ({
  InteractiveCanvas: ({ children, frameloop }: { children: ReactNode; frameloop?: string }) => (
    <div data-testid="interactive-canvas" data-frameloop={frameloop}>{children}</div>
  ),
}))
vi.mock('../ProjectileMotionRig3D', () => ({ ProjectileMotionRig3D: () => <div data-testid="projectile-rig" /> }))

import { ProjectileMotionScene } from '../ProjectileMotionScene'

describe('projectile-motion structure', () => {
  it('opens on a horizontal throw with the givens and answers in the data panel', () => {
    render(<ProjectileMotionScene />)
    const data = within(screen.getByRole('region', { name: '数据' }))
    expect(data.getByText('8.0 m/s · 0° · 5.0 m')).toBeInTheDocument()
    // 平抛 from 5 m: T = √(2h/g) ≈ 1.01 s, x = v₀T ≈ 8.08 m
    expect(data.getByText('1.01 s')).toBeInTheDocument()
    expect(data.getByText('8.08 m')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '平抛' })).toHaveAttribute('aria-checked', 'true')
  })

  it('steps 0.1 s at a time and switches to an oblique throw', () => {
    render(<ProjectileMotionScene />)
    fireEvent.click(screen.getByRole('button', { name: '单步 0.1 s' }))
    fireEvent.click(screen.getByRole('button', { name: '单步 0.1 s' }))
    expect(screen.getByText(/^0\.20 s · \(1\.60, 4\.80\) m$/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('radio', { name: '斜抛' }))
    const data = within(screen.getByRole('region', { name: '数据' }))
    // v₀ = 12 m/s at 45° from the ground: R = v₀²/g ≈ 14.69 m
    expect(data.getByText('14.69 m')).toBeInTheDocument()
    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'demand')
  })
})
