import type { ReactNode } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../scene3d/InteractiveCanvas', () => ({
  InteractiveCanvas: ({ children, frameloop }: { children: ReactNode; frameloop?: string }) => (
    <div data-testid="interactive-canvas" data-frameloop={frameloop}>{children}</div>
  ),
}))
vi.mock('../MechanicalEnergyRig3D', () => ({ MechanicalEnergyRig3D: () => <div data-testid="energy-rig" /> }))

import { MechanicalEnergyScene } from '../MechanicalEnergyScene'

describe('mechanical-energy structure', () => {
  it('starts at rest at h₀ with all energy potential, and keeps E while sliding', () => {
    render(<MechanicalEnergyScene />)
    const data = within(screen.getByRole('region', { name: '数据' }))
    // m = 0.5 kg released from 1.5 m: E = mgh₀ = 7.35 J, bottom speed √(2gh₀) ≈ 5.42 m/s
    expect(data.getByText('0.00 J · 7.35 J')).toBeInTheDocument()
    expect(data.getByText('7.35 J')).toBeInTheDocument()
    expect(data.getByText('5.42 m/s')).toBeInTheDocument()

    for (let i = 0; i < 5; i++) fireEvent.click(screen.getByRole('button', { name: '单步 0.1 s' }))
    expect(data.getByText('7.35 J')).toBeInTheDocument()
    expect(data.queryByText('0.00 J · 7.35 J')).not.toBeInTheDocument()
  })

  it('switches to a rough track with a friction slider', () => {
    render(<MechanicalEnergyScene />)
    fireEvent.click(screen.getByRole('radio', { name: '有摩擦' }))
    expect(screen.getByRole('slider', { name: /动摩擦因数 μ/ })).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: '数据' })).getByText(/小于 5\.42 m\/s/)).toBeInTheDocument()
  })
})
