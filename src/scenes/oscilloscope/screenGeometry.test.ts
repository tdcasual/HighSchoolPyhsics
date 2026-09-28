import { describe, expect, it } from 'vitest'
import { buildCrtScreenGridSegments, clampUnitDeflection, mapDisplayPointToCrtScreen } from './screenGeometry'

describe('CRT phosphor screen geometry', () => {
  it('maps horizontal X deflection to screen depth-axis and vertical Y deflection upward', () => {
    expect(mapDisplayPointToCrtScreen([1, 0])).toEqual([3.162, 0, 0.75])
    expect(mapDisplayPointToCrtScreen([0, -1])).toEqual([3.162, -0.75, 0])
  })

  it('limits simultaneous full-scale deflections to the circular phosphor radius', () => {
    const [horizontal, vertical] = clampUnitDeflection(1, 1)
    const [depth, screenY, screenZ] = mapDisplayPointToCrtScreen([1, 1])

    expect(Math.hypot(horizontal, vertical)).toBeCloseTo(1)
    expect(depth).toBe(3.162)
    expect(Math.hypot(screenY, screenZ)).toBeCloseTo(0.75)
  })

  it('keeps every graticule segment inside the circular screen face', () => {
    const grid = buildCrtScreenGridSegments()

    expect(grid).toHaveLength(16)
    for (const segment of grid) {
      expect(segment).toHaveLength(2)
      for (const [, vertical, horizontal] of segment) {
        expect(Math.hypot(vertical, horizontal)).toBeLessThanOrEqual(0.9 + 1e-9)
      }
    }
  })
})
