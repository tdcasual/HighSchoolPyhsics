import { describe, expect, it } from 'vitest'
import { formatTick, niceMax, niceTicks, paddedExtent, scale, tickFormatter } from './scale'

describe('chart scales', () => {
  it('picks 1-2-2.5-5 ticks that cover the domain', () => {
    expect(niceTicks([0, 1])).toEqual([0, 0.25, 0.5, 0.75, 1])
    expect(niceTicks([-150, 150])).toEqual([-100, 0, 100])
    expect(niceMax(3.2)).toBe(4)
  })

  it('formats ticks by their spacing, with a real minus sign and 10ⁿ for tiny values', () => {
    expect(tickFormatter([0, 0.25, 0.5])(0.25)).toBe('0.25')
    expect(tickFormatter([-100, 0, 100])(-100)).toBe('−100')
    expect(tickFormatter([4e-5, 5e-5, 6e-5])(5e-5)).toBe('5×10⁻⁵')
    expect(formatTick(-0.5)).toBe('−0.5')
  })

  it('maps linear and log domains onto pixels', () => {
    expect(scale([0, 10], [0, 100])(2.5)).toBe(25)
    expect(scale([1, 1000], [0, 300], 'log')(10)).toBeCloseTo(100)
    expect(paddedExtent([2, 2])).toEqual([1.6, 2.4])
  })
})
