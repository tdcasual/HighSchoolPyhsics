import { describe, expect, it } from 'vitest'
import {
  clamp,
  isPresentationSplit,
  resolveLayoutTier,
  resolveLeftPanelBounds,
  resolvePreferredLeftWidthPx,
  SPLIT_DIVIDER_WIDTH_PX,
} from '../layoutPolicy'

describe('layoutPolicy', () => {
  it('resolves layout tier by viewport width', () => {
    expect(resolveLayoutTier(500)).toBe('mobile')
    expect(resolveLayoutTier(900)).toBe('tablet')
    expect(resolveLayoutTier(1366)).toBe('desktop')
  })

  it('identifies presentation split strategy', () => {
    expect(isPresentationSplit(true, 'split')).toBe(true)
    expect(isPresentationSplit(true, 'viewport')).toBe(false)
    expect(isPresentationSplit(false, 'split')).toBe(false)
  })

  it('returns split preferred width as one-third of viewport minus divider', () => {
    const viewportWidth = 1366
    const expected = Math.round((viewportWidth - SPLIT_DIVIDER_WIDTH_PX) / 3)

    expect(resolvePreferredLeftWidthPx(viewportWidth, true, 'split')).toBe(expected)
  })

  it('returns default preferred width in non-split modes', () => {
    expect(resolvePreferredLeftWidthPx(1366, false, 'viewport')).toBe(320)
    expect(resolvePreferredLeftWidthPx(1366, true, 'viewport')).toBe(320)
  })

  it('computes clamped left panel bounds for split mode', () => {
    const bounds = resolveLeftPanelBounds(1366, true, 'split')
    expect(bounds.min).toBe(320)
    expect(bounds.max).toBe(1046)
    expect(bounds.preferred).toBe(447)
  })

  it('clamps value within bounds', () => {
    expect(clamp(10, 20, 40)).toBe(20)
    expect(clamp(50, 20, 40)).toBe(40)
    expect(clamp(30, 20, 40)).toBe(30)
  })
})
