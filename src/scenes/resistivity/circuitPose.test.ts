import { describe, expect, it } from 'vitest'
import { bladeRotation, circuitPose, circuitView, circuitWires, needleRotation, sliderX } from './circuitPose'

describe('resistivity circuit pose', () => {
  it('moves the clip, slider, knife and needles with the reference signs', () => {
    expect(sliderX(0)).toBe(-11)
    expect(sliderX(1)).toBe(15)
    expect(bladeRotation(false)).toBeCloseTo(58 * Math.PI / 180, 8)
    expect(needleRotation(0)).toBeCloseTo(Math.PI / 4, 8)
    expect(needleRotation(0.5)).toBeCloseTo(0, 8)
    expect(needleRotation(1)).toBeCloseTo(-Math.PI / 4, 8)
    const pose = circuitPose({ lengthCm: 50, slider: 1, closed: false, ammeterFraction: 0, voltmeterFraction: 1, temperatureRise: 0 })
    expect(pose.clipX).toBe(25)
    expect(pose.sliderX).toBe(15)
    expect(pose.hot).toBe(0)
    expect(circuitPose({ lengthCm: 0, slider: 0, closed: true, ammeterFraction: 0, voltmeterFraction: 0, temperatureRise: 420 }).hot).toBe(1)
  })

  it('adds the voltmeter only after the second wiring step', () => {
    expect(circuitWires({ step: 0, control: 'limit', method: 'external', ammeter: 'A06', voltmeter: 'V3' })).toEqual([])
    const main = circuitWires({ step: 1, control: 'limit', method: 'external', ammeter: 'A06', voltmeter: 'V3' })
    expect(main.some((wire) => wire[0] === 'bat+')).toBe(true)
    expect(main.some((wire) => wire[0] === 'V3')).toBe(false)
    const full = circuitWires({ step: 2, control: 'limit', method: 'external', ammeter: 'A06', voltmeter: 'V3' })
    expect(full.some((wire) => wire[0] === 'V3' && wire[1] === 'wA')).toBe(true)
  })

  it('keeps the home camera outside the default 16-unit clamp', () => {
    const home = circuitView('home')
    expect(home.radius).toBe(96)
    expect(home.target).toEqual([0, 3, -1])
  })
})
