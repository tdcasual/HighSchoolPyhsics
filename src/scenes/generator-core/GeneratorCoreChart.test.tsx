import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GeneratorCoreChart } from './GeneratorCoreChart'

describe('GeneratorCoreChart', () => {
  it('moves the phase cursor to the correct horizontal chart coordinate', () => {
    const { container, rerender } = render(<GeneratorCoreChart angleRad={Math.PI / 2} running={false} />)
    const tracker = () => container.querySelector('.generator-core-tracker')

    expect(Number(tracker()?.getAttribute('x1'))).toBeCloseTo(127)
    rerender(<GeneratorCoreChart angleRad={0} running={false} />)
    expect(Number(tracker()?.getAttribute('x1'))).toBeCloseTo(34)
  })
})
