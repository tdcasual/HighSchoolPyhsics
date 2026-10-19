import { describe, expect, it } from 'vitest'
import { resolveSafeAreaTransform } from '../safeArea'

const sidebar = { left: 0, top: 0, right: 320, bottom: 975 }
const dataPanel = { left: 340, top: 0, right: 700, bottom: 300 }
const hint = { left: 1500, top: 940, right: 1890, bottom: 970 }

describe('resolveSafeAreaTransform', () => {
  it('centers the composition in the band right of the panel column', () => {
    const transform = resolveSafeAreaTransform({ width: 1900, obstacles: [sidebar, dataPanel, hint] })!
    const left = 700 + 20
    const right = 1900 - 20
    expect(transform.x).toBeCloseTo((left + right) / 2 - 950, 6)
    expect(transform.y).toBe(0)
    // 80% of the original width must fit into the free band.
    expect(transform.scale).toBeCloseTo((right - left) / (1900 * 0.8), 6)
  })

  it('ignores overlays on the right such as the gesture hint', () => {
    expect(resolveSafeAreaTransform({ width: 1900, obstacles: [hint] })).toBeNull()
  })

  it('never shrinks below the readable floor and never enlarges', () => {
    const wide = resolveSafeAreaTransform({ width: 1900, obstacles: [{ left: 0, top: 0, right: 60, bottom: 975 }] })!
    expect(wide.scale).toBe(1)
    const crowded = resolveSafeAreaTransform({ width: 1900, obstacles: [sidebar, { left: 340, top: 0, right: 1180, bottom: 400 }] })!
    expect(crowded.scale).toBe(0.6)
  })

  it('leaves the view alone when the free band is too narrow to use', () => {
    expect(resolveSafeAreaTransform({ width: 800, obstacles: [{ left: 0, top: 0, right: 540, bottom: 600 }] })).toBeNull()
  })
})
