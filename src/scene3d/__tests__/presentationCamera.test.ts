import { describe, expect, it } from 'vitest'
import {
  resolvePresentationCameraDistanceHint,
  resolvePresentationCameraTarget,
} from '../presentationCamera'

describe('presentationCamera', () => {
  it('keeps the base target in overview mode', () => {
    expect(
      resolvePresentationCameraTarget({
        baseTarget: { x: 0, y: 0, z: 0 },
        mode: 'overview',
      }),
    ).toEqual({ x: 0, y: 0, z: 0 })
  })

  it('moves target toward the primary focus in focus mode', () => {
    const result = resolvePresentationCameraTarget({
      baseTarget: { x: 0, y: 0, z: 0 },
      mode: 'focus',
      primary: [4, 2, -2],
    })

    expect(result.x).toBeCloseTo(2.4)
    expect(result.y).toBeCloseTo(1.2)
    expect(result.z).toBeCloseTo(-1.2)
  })

  it('centers between primary and secondary points in compare mode', () => {
    const result = resolvePresentationCameraTarget({
      baseTarget: { x: 0, y: 0, z: 0 },
      mode: 'compare',
      primary: [4, 2, -2],
      secondary: [-2, 4, 2],
    })

    expect(result).toEqual({ x: 1, y: 3, z: 0 })
  })

  it('returns tighter distance hints for focus mode and looser for compare mode', () => {
    expect(resolvePresentationCameraDistanceHint({ baseDistance: 12, mode: 'focus' })).toBeCloseTo(10.2)
    expect(resolvePresentationCameraDistanceHint({ baseDistance: 12, mode: 'compare' })).toBeCloseTo(12.6)
  })
})
