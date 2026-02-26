import { describe, expect, it } from 'vitest'
import { BEAM_VISUAL_STYLE } from './beamVisual'

describe('beam visual style', () => {
  it('uses high-contrast colors for long-distance classroom visibility', () => {
    expect(BEAM_VISUAL_STYLE.pathColor).toBe('#39f6ff')
    expect(BEAM_VISUAL_STYLE.trailColor).toBe('#ffffff')
    expect(BEAM_VISUAL_STYLE.trailHaloColor).toBe('#ff7a1a')
    expect(BEAM_VISUAL_STYLE.trailWidth).toBeGreaterThanOrEqual(5)
  })
})
