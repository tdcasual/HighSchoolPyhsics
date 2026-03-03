import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'

vi.mock('../../../scene3d/InteractiveCanvas', () => ({
  InteractiveCanvas: ({
    frameloop,
    wheelZoomIntentGuard,
    children,
  }: {
    frameloop?: 'always' | 'demand'
    wheelZoomIntentGuard?: boolean
    children: ReactNode
  }) => (
    <div
      data-testid="interactive-canvas"
      data-frameloop={frameloop ?? 'always'}
      data-wheel-guard={wheelZoomIntentGuard ? 'on' : 'off'}
    >
      {children}
    </div>
  ),
}))

vi.mock('../EquipotentialRig3D', () => ({
  EquipotentialRig3D: () => <div data-testid="equipotential-rig" />,
}))

import { EquipotentialScene } from '../EquipotentialScene'

describe('equipotential frameloop policy', () => {
  it('uses demand frameloop to keep camera view stable while idle', () => {
    render(<EquipotentialScene />)

    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'demand')
    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-wheel-guard', 'on')
  })
})
