import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MeasuringToolsChart } from './MeasuringToolsChart'
import { vernierLabel } from './scalePaint'

function texts(container: HTMLElement) {
  return Array.from(container.querySelectorAll('text')).map((node) => node.textContent)
}

describe('exam-style reading figures', () => {
  it('prints vernier numbers the way exam papers do', () => {
    const labels = (n: 10 | 20 | 50) => Array.from({ length: n + 1 }, (_, mark) => vernierLabel(n, mark)).filter(Boolean)
    expect(labels(10)).toEqual(['0', '5', '10'])
    expect(labels(20)).toEqual(['0', '10', '20'])
    expect(labels(50)).toEqual(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'])
  })

  it('labels the caliper main scale in cm and aligns vernier line k with main line main+k', () => {
    const { container } = render(
      <MeasuringToolsChart tool="caliper" reveal divisions={20} caliperX={23.45} micGap={0} micZero={0} click={0} />,
    )
    expect(texts(container)).toEqual(expect.arrayContaining(['2', '3', 'cm']))
    const vernierLine = screen.getByTestId('aligned-vernier')
    const mainLine = screen.getByTestId('aligned-main')
    expect(vernierLine.getAttribute('data-line')).toBe('9')
    expect(Number(vernierLine.getAttribute('x1'))).toBeCloseTo(Number(mainLine.getAttribute('x1')), 6)
  })

  it('hides the aligned line until the reading is revealed', () => {
    render(<MeasuringToolsChart tool="caliper" reveal={false} divisions={10} caliperX={12.3} micGap={0} micZero={0} click={0} />)
    expect(screen.queryByTestId('aligned-vernier')).not.toBeInTheDocument()
    expect(screen.getByTestId('caliper-reading')).toHaveTextContent('读数在判定后显示')
  })

  it('draws the micrometer sleeve up to the thimble edge with the aligned division on the datum', () => {
    const { container } = render(
      <MeasuringToolsChart tool="micrometer" reveal divisions={20} caliperX={0} micGap={5.237} micZero={0} click={0} />,
    )
    expect(texts(container)).toEqual(expect.arrayContaining(['0', '5', '20', '25']))
    expect(screen.getByTestId('micrometer-reading')).toHaveTextContent('5.0 mm + 23.7 × 0.01 mm = 5.237 mm')
    const edge = Number(screen.getByTestId('thimble-body').getAttribute('x'))
    const lastSleeve = Number(screen.getByTestId('last-sleeve-line').getAttribute('x1'))
    expect(lastSleeve).toBeLessThan(edge)
    expect(edge - lastSleeve).toBeCloseTo(0.237 * 58, 4)
    const aligned = screen.getByTestId('aligned-thimble')
    const datum = Number(screen.getByTestId('sleeve-datum').getAttribute('y1'))
    expect(Math.abs(Number(aligned.getAttribute('y1')) - datum)).toBeLessThan(12 / 2 + 1e-9)
  })

  it('exposes the half-millimetre line once the edge passes it', () => {
    render(<MeasuringToolsChart tool="micrometer" reveal divisions={20} caliperX={0} micGap={2.62} micZero={0} click={0} />)
    expect(screen.getByTestId('micrometer-reading')).toHaveTextContent('2.5 mm + 12.0 × 0.01 mm = 2.620 mm')
    const half = screen.getByTestId('last-sleeve-line')
    expect(Number(half.getAttribute('y2'))).toBeGreaterThan(Number(half.getAttribute('y1')))
  })
})
