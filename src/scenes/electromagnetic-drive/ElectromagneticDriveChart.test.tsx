import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ElectromagneticDriveChart } from './ElectromagneticDriveChart'

describe('ElectromagneticDriveChart', () => {
  it('plots both speeds on a shared rad/s axis that starts at zero', () => {
    const { container } = render(
      <ElectromagneticDriveChart magnetSpeeds={[0, 1.2, 2.4, 3.2]} frameSpeeds={[0, 0.3, 0.9, 1.7]} />,
    )
    const chart = screen.getByRole('img', { name: /角速度对比图/ })
    expect(chart).toHaveTextContent('rad·s⁻¹')
    expect([...container.querySelectorAll('.chart-tick')].map((tick) => tick.textContent)).toEqual(['0', '2', '4', '6'])
    // Theme tokens, not fixed colours, so the chart follows day/night.
    const strokes = [...container.querySelectorAll('path[stroke]')].map((path) => path.getAttribute('stroke'))
    expect(strokes).toEqual(['var(--chart-2)', 'var(--chart-1)'])
    expect(container.textContent).toContain('横轴：采样先后')
  })
})
