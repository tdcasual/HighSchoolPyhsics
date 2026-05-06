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

vi.mock('../MotionalEmfRig3D', () => ({
  MotionalEmfRig3D: () => <div data-testid="motional-emf-rig" />,
}))

import { MotionalEmfScene } from '../MotionalEmfScene'

describe('motional-emf frameloop policy', () => {
  it('uses demand frameloop when paused to save GPU resources', () => {
    render(<MotionalEmfScene />)

    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'demand')
  })
})
