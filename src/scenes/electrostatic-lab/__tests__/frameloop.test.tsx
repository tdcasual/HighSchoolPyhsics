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

vi.mock('../ElectrostaticLabRig3D', () => ({
  ElectrostaticLabRig3D: () => <div data-testid="electrostatic-lab-rig" />,
}))

import { ElectrostaticLabScene } from '../ElectrostaticLabScene'

describe('electrostatic-lab frameloop policy', () => {
  it('uses demand frameloop while idle to prevent apparent camera drift', () => {
    render(<ElectrostaticLabScene />)

    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'demand')
    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-wheel-guard', 'on')
  })
})
