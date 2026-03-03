import { fireEvent, render, screen } from '@testing-library/react'
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

vi.mock('../PotentialEnergyRig3D', () => ({
  PotentialEnergyRig3D: () => <div data-testid="potential-energy-rig" />,
}))

import { PotentialEnergyScene } from '../PotentialEnergyScene'

describe('potential-energy frameloop policy', () => {
  it('stays in demand mode by default and switches to always only during surface rotation', () => {
    render(<PotentialEnergyScene />)

    const canvas = screen.getByTestId('interactive-canvas')
    expect(canvas).toHaveAttribute('data-frameloop', 'demand')

    fireEvent.click(screen.getByRole('button', { name: '1. 显示电势切片' }))
    fireEvent.click(screen.getByRole('button', { name: '2. 开始旋转' }))

    expect(canvas).toHaveAttribute('data-frameloop', 'always')
  })
})
