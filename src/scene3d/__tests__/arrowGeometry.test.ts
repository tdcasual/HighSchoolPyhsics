import { Vector3 } from 'three'
import { describe, expect, it } from 'vitest'
import { arrowGeometry } from '../arrowGeometry'

describe('arrowGeometry', () => {
  it('gives the head the last headLength and the shaft the rest', () => {
    const g = arrowGeometry([0, 0, 0], [0, 0, 2], 0.5)!
    expect(g.shaftLength).toBeCloseTo(1.5)
    expect(g.base).toEqual([0, 0, 1.5])
    expect(g.shaftCenter).toEqual([0, 0, 0.75])
    expect(g.headCenter).toEqual([0, 0, 1.75])
  })

  it('turns the cone axis (+Y) onto the arrow, also when it points straight down', () => {
    for (const to of [
      [3, 4, 0],
      [0, -1, 0],
    ] as const) {
      const g = arrowGeometry([0, 0, 0], to, 0.2)!
      const axis = new Vector3(0, 1, 0).applyQuaternion(g.quaternion)
      const expected = new Vector3(...to).normalize()
      expect(axis.distanceTo(expected)).toBeLessThan(1e-9)
    }
  })

  it('makes a short arrow all head and draws nothing for zero length', () => {
    const g = arrowGeometry([1, 1, 1], [1, 1.1, 1], 0.3)!
    expect(g.shaftLength).toBe(0)
    expect(g.headLength).toBeCloseTo(0.1)
    expect(arrowGeometry([1, 2, 3], [1, 2, 3], 0.2)).toBeNull()
  })
})
