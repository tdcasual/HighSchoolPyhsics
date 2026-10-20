import type { ReactNode } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../scene3d/InteractiveCanvas', () => ({
  InteractiveCanvas: ({ children, frameloop }: { children: ReactNode; frameloop?: string }) => (
    <div data-testid="interactive-canvas" data-frameloop={frameloop}>{children}</div>
  ),
}))
vi.mock('../MomentumCollisionRig3D', () => ({ MomentumCollisionRig3D: () => <div data-testid="collision-rig" /> }))

import { MomentumCollisionScene } from '../MomentumCollisionScene'

describe('momentum-collision structure', () => {
  it('equal-mass elastic collision swaps velocities and conserves momentum', () => {
    render(<MomentumCollisionScene />)
    const data = within(screen.getByRole('region', { name: '数据' }))
    expect(data.getByText('0.00 · 0.60 m/s')).toBeInTheDocument()
    expect(data.getAllByText('0.120 kg·m/s')).toHaveLength(2)
    expect(data.getByText('0.0000 J（0%）')).toBeInTheDocument()
  })

  it('perfectly inelastic collision: common velocity and half the kinetic energy lost', () => {
    render(<MomentumCollisionScene />)
    fireEvent.click(screen.getByRole('button', { name: '完全非弹性：粘在一起' }))
    const data = within(screen.getByRole('region', { name: '数据' }))
    expect(data.getByText('0.30 · 0.30 m/s')).toBeInTheDocument()
    expect(data.getByText('0.0180 J（50%）')).toBeInTheDocument()
  })
})
