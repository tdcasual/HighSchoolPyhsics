import { describe, expect, it } from 'vitest'
import { createPatternCache, fastPow08, getCircleMask } from '../patternCanvas'

const sums = (n: number) => [new Float32Array(n), new Float32Array(n), new Float32Array(n)] as const

describe('white-light pattern cache', () => {
  it('keeps the most recently used entries within the entry limit', () => {
    const cache = createPatternCache(1e9, 2)
    cache.store('a', ...sums(4))
    cache.store('b', ...sums(4))
    expect(cache.get('a', 4)?.key).toBe('a')
    cache.store('c', ...sums(4))
    expect(cache.size()).toBe(2)
    expect(cache.get('b', 4)).toBeNull()
    expect(cache.get('a', 4)?.key).toBe('a')
  })

  it('replaces an existing key, respects the byte budget and drops entries too small for the canvas', () => {
    const cache = createPatternCache(3 * 4 * 8, 5)
    cache.store('a', ...sums(4))
    cache.store('a', ...sums(4))
    expect(cache.size()).toBe(1)
    cache.store('b', ...sums(8))
    expect(cache.get('a', 4)).toBeNull()
    expect(cache.get('b', 16)).toBeNull()
    cache.setMax(0)
    cache.store('c', ...sums(2))
    expect(cache.size()).toBe(0)
  })
})

describe('pixel helpers', () => {
  it('approximates x^0.8 and masks a round field row by row', () => {
    for (const x of [0.1, 0.5, 0.9]) expect(fastPow08(x)).toBeCloseTo(x ** 0.8, 1)
    const { rowMinX, rowMaxX } = getCircleMask(11, 11, 5, 5, 5)
    expect([rowMinX[5], rowMaxX[5]]).toEqual([0, 10])
    expect([rowMinX[0], rowMaxX[0]]).toEqual([5, 5])
  })
})
