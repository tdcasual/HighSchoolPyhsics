import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DiffractionScene } from '../DiffractionScene'

vi.mock('../DiffractionControls', () => ({
  DiffractionControls: () => <div data-testid="diffraction-controls">controls</div>,
}))

vi.mock('../DiffractionProfile', () => ({
  DiffractionProfile: () => <div data-testid="diffraction-profile">profile</div>,
}))

describe('diffraction structure', () => {
  it('renders controls and profile', () => {
    render(<DiffractionScene />)
    expect(screen.getByTestId('diffraction-controls')).toBeInTheDocument()
    expect(screen.getByTestId('diffraction-profile')).toBeInTheDocument()
  })
})
