import { describe, expect, it } from 'vitest'
import { DEFAULT_ADAPTIVE_FRAMING, resolveAdaptiveFramingTarget } from '../adaptiveFraming'

describe('adaptive framing', () => {
  it('uses stronger default horizontal shift for zoomed-out framing', () => {
    expect(DEFAULT_ADAPTIVE_FRAMING.shiftX).toBeCloseTo(1)
    expect(DEFAULT_ADAPTIVE_FRAMING.zoomInShiftX).toBeGreaterThan(0)
    expect(DEFAULT_ADAPTIVE_FRAMING.zoomInShiftY).toBeGreaterThan(0)
  })

  it('keeps base target when distance does not exceed zoom start', () => {
    const base = { x: 0, y: -0.66, z: 0 }
    const result = resolveAdaptiveFramingTarget({
      baseTarget: base,
      distance: 10.2,
      zoomStartDistance: 10.4,
      zoomEndDistance: 11.5,
      shiftX: 0.6,
      shiftY: 1,
    })
    expect(result).toEqual(base)
  })

  it('moves target right and downward as distance approaches zoom end', () => {
    const base = { x: 0, y: -0.66, z: 0 }
    const result = resolveAdaptiveFramingTarget({
      baseTarget: base,
      distance: 11.5,
      zoomStartDistance: 10.4,
      zoomEndDistance: 11.5,
      shiftX: 0.6,
      shiftY: 1,
    })
    expect(result.x).toBeCloseTo(0.6)
    expect(result.y).toBeCloseTo(-1.66)
    expect(result.z).toBeCloseTo(0)
  })

  it('clamps progress when distance exceeds max distance', () => {
    const base = { x: 0.2, y: -0.4, z: 0.1 }
    const result = resolveAdaptiveFramingTarget({
      baseTarget: base,
      distance: 20,
      zoomStartDistance: 10,
      zoomEndDistance: 12,
      shiftX: 0.5,
      shiftY: 0.8,
    })
    expect(result.x).toBeCloseTo(0.7)
    expect(result.y).toBeCloseTo(-1.2)
    expect(result.z).toBeCloseTo(0.1)
  })

  it('moves target right and upward when zooming in within zoom-in range', () => {
    const base = { x: 0, y: -0.66, z: 0 }
    const result = resolveAdaptiveFramingTarget({
      baseTarget: base,
      distance: 7.5,
      zoomStartDistance: 10,
      zoomEndDistance: 12,
      zoomInEndDistance: 6,
      shiftX: 1,
      shiftY: 1,
      zoomInShiftX: 0.4,
      zoomInShiftY: 0.5,
    })

    expect(result.x).toBeCloseTo(0.25)
    expect(result.y).toBeCloseTo(-0.9725)
    expect(result.z).toBeCloseTo(0)
  })
})
