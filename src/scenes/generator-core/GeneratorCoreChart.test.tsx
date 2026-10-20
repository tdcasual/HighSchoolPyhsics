import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GeneratorCoreChart } from './GeneratorCoreChart'

describe('GeneratorCoreChart', () => {
  it('moves the phase cursor with θ: a quarter of the axis at π/2', () => {
    const { container, rerender } = render(<GeneratorCoreChart angleRad={0} running={false} />)
    const cursorX = () => Number(container.querySelector('.chart-cursor line')?.getAttribute('x1'))
    const start = cursorX()
    rerender(<GeneratorCoreChart angleRad={Math.PI} running={false} />)
    const middle = cursorX()
    rerender(<GeneratorCoreChart angleRad={Math.PI / 2} running={false} />)
    expect(cursorX()).toBeCloseTo((start + middle) / 2)
    expect(middle).toBeGreaterThan(start)
  })
})
