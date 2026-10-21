import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { IdealGasIsochoricScene } from '../IdealGasIsochoricScene'

describe('ideal-gas-isochoric structure', () => {
  it('renders fixed-volume controls, telemetry, paired charts and playback', () => {
    render(<IdealGasIsochoricScene />)
    // Chart, playback (and some data) panels start collapsed; open them as a teacher would.
    screen.queryAllByRole('button', { name: '展开' }).forEach((button) => fireEvent.click(button))
    expect(screen.getByRole('heading', { name: '理想气体等容变化（查理定律）' })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: '热力学温度 T' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'V₃ = 6.0 L（大）' })).toBeInTheDocument()
    expect(screen.getByText('p/T = 0.0032 atm/K')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '压强与热力学温度图像' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '压强与摄氏温度图像' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '暂停热运动' })).toBeInTheDocument()
  })

  it('switches volume and pauses molecular motion', () => {
    render(<IdealGasIsochoricScene />)
    fireEvent.click(screen.getByRole('radio', { name: 'V₁ = 2.0 L（小）' }))
    expect(screen.getByText(/固定体积 V/)).toBeInTheDocument()
    expect(screen.getByText('p/T = 0.0095 atm/K')).toBeInTheDocument()
    // Chart, playback (and some data) panels start collapsed; open them as a teacher would.
    screen.queryAllByRole('button', { name: '展开' }).forEach((button) => fireEvent.click(button))
    fireEvent.click(screen.getByRole('button', { name: '暂停热运动' }))
    expect(screen.getByRole('button', { name: '继续热运动' })).toBeInTheDocument()
    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'demand')
  })
})
