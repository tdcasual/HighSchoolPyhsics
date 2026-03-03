import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'

vi.mock('../../../scene3d/InteractiveCanvas', () => ({
  InteractiveCanvas: ({
    frameloop,
    children,
  }: {
    frameloop?: 'always' | 'demand'
    children: ReactNode
  }) => (
    <div data-testid="interactive-canvas" data-frameloop={frameloop ?? 'always'}>
      {children}
    </div>
  ),
}))

vi.mock('../ElectrostaticLabRig3D', () => ({
  ElectrostaticLabRig3D: () => <div data-testid="electrostatic-lab-rig" />,
}))

import { ElectrostaticLabScene } from '../ElectrostaticLabScene'

describe('electrostatic-lab frameloop policy', () => {
  it('uses demand frameloop while idle to prevent apparent camera drift', () => {
    render(<ElectrostaticLabScene />)

    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'demand')
  })
})
