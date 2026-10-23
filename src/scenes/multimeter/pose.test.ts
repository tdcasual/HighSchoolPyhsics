import { describe, expect, it } from 'vitest'
import { knobRotation, meterPose, meterView, needleRotation, probeTips } from './pose'

describe('multimeter pose', () => {
  it('parks the needle at the centre for half scale and 48 degrees left at zero', () => {
    expect(needleRotation(0.5)).toBeCloseTo(0, 8)
    expect(needleRotation(0)).toBeCloseTo((48 * Math.PI) / 180, 8)
    expect(needleRotation(1)).toBeCloseTo((-48 * Math.PI) / 180, 8)
  })

  it('turns the range knob 30 degrees per stop and swaps the probe tips', () => {
    expect(knobRotation('OFF')).toBeCloseTo((150 * Math.PI) / 180, 8)
    expect(knobRotation('V2.5')).toBeCloseTo((120 * Math.PI) / 180, 8)
    const normal = probeTips('cell', false)
    const swapped = probeTips('cell', true)
    expect(normal.red).toEqual([-5.6, 2.7, 9])
    expect(swapped.red).toEqual(normal.black)
    expect(meterView('home').radius).toBe(62)
  })

  it('copies the needle and probe pose onto one record', () => {
    const pose = meterPose({
      fraction: 0.5,
      range: 'OFF',
      mechanicalSlider: -2.8,
      ohmSlider: 5,
      target: 'resistor',
      swapped: false,
    })
    expect(pose.needle).toBeCloseTo(0, 8)
    expect(pose.screw).toBeCloseTo((-2.8 / 5) * 3, 8)
    expect(pose.ohmKnob).toBeCloseTo((5 / 10) * 3, 8)
    expect(pose.red).toEqual([-2.6, 2.7, 9])
  })
})
