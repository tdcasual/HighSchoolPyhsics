import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../LightDiffractionControls', () => ({
  LightDiffractionControls: () => <div data-testid="light-diffraction-controls" />,
}))

vi.mock('../LightDiffractionChart', () => ({
  LightDiffractionChart: () => <div data-testid="light-diffraction-chart" />,
}))

import { LightDiffractionScene } from '../LightDiffractionScene'

describe('light-diffraction structure', () => {
  it('renders controls, viewport and rig', () => {
    render(<LightDiffractionScene />)

    expect(screen.getByTestId('interactive-canvas')).toBeInTheDocument()
    expect(screen.getByTestId('light-diffraction-controls')).toBeInTheDocument()
  })

  it('uses demand frameloop for static scene', () => {
    render(<LightDiffractionScene />)

    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'demand')
  })

  it('shows key data overlay values when the data panel is expanded', () => {
    render(<LightDiffractionScene />)
    screen.queryAllByRole('button', { name: '展开' }).forEach((button) => fireEvent.click(button))

    expect(screen.getByText(/模式/)).toBeInTheDocument()
    expect(screen.getByText(/波长 λ/)).toBeInTheDocument()
    expect(screen.getByText(/缝屏距 L/)).toBeInTheDocument()
    expect(screen.getByText(/缝宽 a|孔径 D|光栅缝宽/)).toBeInTheDocument()
  })
})
