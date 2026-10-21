import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ElectrostaticLabScene } from '../ElectrostaticLabScene'

describe('electrostatic-lab frameloop policy', () => {
  it('uses demand frameloop while idle to prevent apparent camera drift', () => {
    render(<ElectrostaticLabScene />)

    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'demand')
  })
})
