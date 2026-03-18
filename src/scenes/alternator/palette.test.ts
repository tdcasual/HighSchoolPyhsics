import { describe, expect, it } from 'vitest'
import { getAlternatorPalette } from './palette'

describe('alternator palette', () => {
  it('uses lighter orange/blue for day-mode poles and matching wires', () => {
    const day = getAlternatorPalette('day')

    expect(day.magnetNorth).toBe('#FF7043')
    expect(day.magnetSouth).toBe('#29B6F6')
    expect(day.wireOrange).toBe('#FF7043')
    expect(day.wireBlue).toBe('#29B6F6')
    expect(day.ringOrange).toBe('#FF9A76')
    expect(day.ringBlue).toBe('#4FC3F7')
  })

  it('uses white wires and lighter components in night mode', () => {
    const night = getAlternatorPalette('night')

    expect(night.wireOrange).toBe('#ffffff')
    expect(night.wireBlue).toBe('#ffffff')
    expect(night.circuit).toBe('#ffffff')
    expect(night.meterCasing).toBe('#ffffff')
    expect(night.meterBorder).toBe('#cccccc')
    expect(night.meterNeedle).toBe('#ff6666')
    expect(night.magnetNorth).toBe('#FF8A65')
    expect(night.magnetSouth).toBe('#4FC3F7')
  })

  it('returns distinct viewport colors for day and night themes', () => {
    const day = getAlternatorPalette('day')
    const night = getAlternatorPalette('night')

    expect(day.background).not.toBe(night.background)
    expect(day.label).not.toBe(night.label)
    expect(day.axis).not.toBe(night.axis)
  })
})
