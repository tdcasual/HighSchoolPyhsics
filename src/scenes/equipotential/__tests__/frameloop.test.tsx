import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { EquipotentialScene } from '../EquipotentialScene'

describe('equipotential frameloop policy', () => {
  it('uses demand frameloop to keep camera view stable while idle', () => {
    render(<EquipotentialScene />)

    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'demand')
  })
})
