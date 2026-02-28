import { describe, expect, it } from 'vitest'
import { add, cross, dot, length, normalize, scale, sub, type Vec3 } from './vectorMath'

describe('oersted vector math', () => {
  it('computes dot and cross products for orthogonal vectors', () => {
    const x: Vec3 = { x: 1, y: 0, z: 0 }
    const y: Vec3 = { x: 0, y: 1, z: 0 }

    expect(dot(x, y)).toBe(0)
    expect(cross(x, y)).toEqual({ x: 0, y: 0, z: 1 })
  })

  it('normalizes non-zero vectors and keeps zero-safe fallback direction', () => {
    expect(normalize({ x: 0, y: 3, z: 4 })).toEqual({ x: 0, y: 0.6, z: 0.8 })
    expect(normalize({ x: 0, y: 0, z: 0 })).toEqual({ x: 0, y: 0, z: 1 })
  })

  it('supports add/sub/scale composition', () => {
    const a: Vec3 = { x: 1, y: 2, z: 3 }
    const b: Vec3 = { x: -2, y: 4, z: 1 }

    expect(add(a, b)).toEqual({ x: -1, y: 6, z: 4 })
    expect(sub(a, b)).toEqual({ x: 3, y: -2, z: 2 })
    expect(scale(a, 2)).toEqual({ x: 2, y: 4, z: 6 })
    expect(length({ x: 3, y: 4, z: 0 })).toBe(5)
  })
})
