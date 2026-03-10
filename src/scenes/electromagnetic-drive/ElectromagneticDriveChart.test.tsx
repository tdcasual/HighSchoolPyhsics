import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ElectromagneticDriveChart } from './ElectromagneticDriveChart'

describe('ElectromagneticDriveChart theme tokens', () => {
  it('uses CSS theme variables for day/night friendly line, fill, and axis colors', () => {
    const { container } = render(
      <ElectromagneticDriveChart
        magnetSpeeds={[0, 1.2, 2.4, 3.2]}
        frameSpeeds={[0, 0.3, 0.9, 1.7]}
      />,
    )

    const lines = Array.from(container.querySelectorAll('line'))
    const texts = Array.from(container.querySelectorAll('text'))
    const paths = Array.from(container.querySelectorAll('path'))
    const stops = Array.from(container.querySelectorAll('stop'))

    expect(lines[0]?.getAttribute('stroke')).toBe('var(--electromagnetic-drive-chart-grid-line)')
    expect(lines.at(-1)?.getAttribute('stroke')).toBe('var(--electromagnetic-drive-chart-axis-line)')
    expect(texts[0]?.getAttribute('fill')).toBe('var(--electromagnetic-drive-chart-axis-text)')
    expect(texts[1]?.getAttribute('fill')).toBe('var(--electromagnetic-drive-chart-axis-subtext)')
    expect(paths[2]?.getAttribute('stroke')).toBe('var(--electromagnetic-drive-chart-magnet-line)')
    expect(paths[3]?.getAttribute('stroke')).toBe('var(--electromagnetic-drive-chart-frame-line)')
    expect(stops[0]?.getAttribute('stop-color')).toBe('var(--electromagnetic-drive-chart-magnet-fill-top)')
    expect(stops[2]?.getAttribute('stop-color')).toBe('var(--electromagnetic-drive-chart-frame-fill-top)')
  })
})
