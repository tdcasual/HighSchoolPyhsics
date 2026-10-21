import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { MotionalEmfScene } from '../MotionalEmfScene'

describe('motional-emf frameloop policy', () => {
  it('uses demand frameloop when paused to save GPU resources', () => {
    render(<MotionalEmfScene />)

    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'demand')
  })
})
