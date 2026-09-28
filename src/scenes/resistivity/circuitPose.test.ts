import { describe, expect, it } from 'vitest'
import { bladeRotation, circuitPose, circuitView, circuitWires, meterIntervals, needleRotation, sliderX, terminalPosition, wireEnd } from './circuitPose'

describe('resistivity circuit pose', () => {
  it('moves the clip, slider, knife and needles with the reference signs', () => {
    expect(sliderX(0)).toBe(-11)
    expect(sliderX(0.5)).toBe(2)
    expect(sliderX(1)).toBe(15)
    expect(sliderX(-1)).toBe(-11)
    expect(sliderX(2)).toBe(15)
    expect(bladeRotation(false)).toBeCloseTo(58 * Math.PI / 180, 8)
    expect(needleRotation(0)).toBeCloseTo(Math.PI / 4, 8)
    expect(needleRotation(0.5)).toBeCloseTo(0, 8)
    expect(needleRotation(1)).toBeCloseTo(-Math.PI / 4, 8)
    const pose = circuitPose({ lengthCm: 50, slider: 1, closed: false, ammeterFraction: 0, voltmeterFraction: 1, temperatureRise: 0 })
    expect(pose.clipX).toBe(25)
    expect(pose.sliderX).toBe(15)
    expect(terminalPosition('rh-w', pose)).toEqual([15, 9.9, -14])
    expect(terminalPosition('wP', pose)).toEqual([25, 4.85, 11.2])
    expect(wireEnd(10)).toEqual([-15, 4.85, 11.2])
    expect(wireEnd(50)).toEqual([25, 4.85, 11.2])
    expect(pose.hot).toBe(0)
    expect(circuitPose({ lengthCm: 0, slider: 0, closed: true, ammeterFraction: 0, voltmeterFraction: 0, temperatureRise: 420 }).hot).toBe(1)
  })

  it('matches each analogue dial to the declared meter division', () => {
    expect(meterIntervals(0.6, 0.02)).toBe(30)
    expect(meterIntervals(3, 0.1)).toBe(30)
    expect(meterIntervals(15, 0.5)).toBe(30)
    expect(meterIntervals(0.6, 0.02, true)).toBe(60)
    expect(meterIntervals(3, 0.1, true)).toBe(60)
  })

  it('adds the voltmeter only after the second wiring step', () => {
    expect(circuitWires({ step: 0, control: 'limit', method: 'external', ammeter: 'A06', voltmeter: 'V3' })).toEqual([])
    const main = circuitWires({ step: 1, control: 'limit', method: 'external', ammeter: 'A06', voltmeter: 'V3' })
    expect(main.some((wire) => wire[0] === 'bat+')).toBe(true)
    expect(main.some((wire) => wire[0] === 'V3')).toBe(false)
    const full = circuitWires({ step: 2, control: 'limit', method: 'external', ammeter: 'A06', voltmeter: 'V3' })
    expect(full.some((wire) => wire[0] === 'rh-w' && wire[1] === 'A0.6')).toBe(true)
    expect(full.some((wire) => wire[0] === 'rh-d')).toBe(false)
    expect(full.some((wire) => wire[0] === 'V3' && wire[1] === 'wA')).toBe(true)
    expect(full.find((wire) => wire[0] === 'A−')?.[2]).toBe('black')
    const internalDivider = circuitWires({ step: 2, control: 'divider', method: 'internal', ammeter: 'A3', voltmeter: 'V15' })
    expect(internalDivider.some((wire) => wire[0] === 'rh-w' && wire[1] === 'A3')).toBe(true)
    expect(internalDivider.some((wire) => wire[0] === 'V15' && wire[1] === 'A3')).toBe(true)
    expect(internalDivider.some((wire) => wire[0] === 'V−' && wire[1] === 'wP')).toBe(true)
    const positiveIv = circuitWires({
      step: 2, control: 'limit', method: 'external', ammeter: 'A06', voltmeter: 'V3', ivMode: true, voltage: 1,
    })
    expect(positiveIv.some((wire) => wire[0] === 'sw2' && wire[1] === 'A0.6')).toBe(true)
    expect(positiveIv.some((wire) => wire[0] === 'rh-w')).toBe(false)
    const reverseIv = circuitWires({
      step: 2, control: 'limit', method: 'external', ammeter: 'A06', voltmeter: 'V3', ivMode: true, voltage: -1,
    })
    expect(reverseIv.some((wire) => wire[0] === 'sw2' && wire[1] === 'wP')).toBe(true)
    expect(reverseIv.some((wire) => wire[0] === 'wA' && wire[1] === 'A−')).toBe(true)
    expect(reverseIv.some((wire) => wire[0] === 'A0.6' && wire[1] === 'bat-')).toBe(true)
    expect(reverseIv.some((wire) => wire[0] === 'V3' && wire[1] === 'wA')).toBe(true)
  })

  it('keeps the home camera outside the default 16-unit clamp', () => {
    const home = circuitView('home')
    expect(home.radius).toBe(96)
    expect(home.target).toEqual([0, 3, -1])
  })
})
