import { describe, expect, it } from 'vitest'
import {
  DEFAULT_NEEDLE_PLACEMENTS,
  EARTH_NORTH_HEADING_DEG,
  OERSTED_PRESETS,
} from './oerstedPresets'

describe('oersted presets', () => {
  it('keeps classroom-ready preset ids and default placement rows', () => {
    expect(OERSTED_PRESETS.map((preset) => preset.id)).toEqual([
      'favorable',
      'unfavorable',
      'orientation',
    ])
    expect(DEFAULT_NEEDLE_PLACEMENTS).toHaveLength(3)
    expect(DEFAULT_NEEDLE_PLACEMENTS[1]).toEqual({ x: 0.03, z: 0 })
    expect(EARTH_NORTH_HEADING_DEG).toBe(0)
  })
})
