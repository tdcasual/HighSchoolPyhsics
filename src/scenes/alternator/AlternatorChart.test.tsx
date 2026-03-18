import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AlternatorChart } from './AlternatorChart'

describe('AlternatorChart', () => {
  it('renders a U-t waveform with axes, a trace, and current-point labels', () => {
    render(
      <AlternatorChart
        voltageHistory={[0, 1, 0, -1, 0]}
        currentVoltageV={1}
        currentTimeLabel="1.20 s"
        peakVoltageV={2}
      />,
    )

    expect(screen.getByText('U-t 图')).toBeInTheDocument()
    expect(screen.getByText('当前时刻 1.20 s')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '交流发电机电压时间图' })).toBeInTheDocument()
    expect(screen.getByText('2.00 V')).toBeInTheDocument()
    expect(screen.getByText('-2.00 V')).toBeInTheDocument()
  })

  it('keeps a fixed time scale instead of stretching short histories across the whole chart', () => {
    const { container } = render(
      <AlternatorChart
        voltageHistory={[0, 1]}
        currentVoltageV={1}
        currentTimeLabel="0.10 s"
        peakVoltageV={2}
      />,
    )

    const path = container.querySelector('path')
    expect(path).toBeInTheDocument()
    expect(path?.getAttribute('d')).toContain('L 27.')
    expect(path?.getAttribute('d')).not.toContain('L 342.00')
  })
})
