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
  it('renders controls and keeps the optional profile hidden by default', () => {
    render(<DiffractionScene />)
    expect(screen.getByTestId('diffraction-controls')).toBeInTheDocument()
    expect(screen.queryByTestId('diffraction-profile')).not.toBeInTheDocument()
  })
})
