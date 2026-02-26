import { describe, expect, it } from 'vitest'
import { appendTrailPoint } from './trail'

describe('cyclotron trail helpers', () => {
  it('skips points that are too close to the previous sample', () => {
    const previous: [number, number, number][] = [[0, 0, 0], [0.5, 0, 0.5]]
    const next: [number, number, number] = [0.504, 0, 0.502]

    const updated = appendTrailPoint(previous, next, 900)

    expect(updated).toBe(previous)
  })

  it('restarts the trail when point jump is abnormally large', () => {
    const previous: [number, number, number][] = [[0, 0, 0], [0.6, 0, 0.6]]
    const next: [number, number, number] = [2.1, 0, -2.0]

    const updated = appendTrailPoint(previous, next, 900)

    expect(updated).toEqual([next])
  })

  it('appends regular samples and keeps tail within max size', () => {
    const previous: [number, number, number][] = [[0, 0, 0], [0.3, 0, 0.3]]
    const next: [number, number, number] = [0.46, 0, 0.44]

    const updated = appendTrailPoint(previous, next, 2)

    expect(updated).toEqual([[0.3, 0, 0.3], [0.46, 0, 0.44]])
  })
})
