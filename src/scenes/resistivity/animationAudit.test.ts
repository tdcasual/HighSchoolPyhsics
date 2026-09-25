import { describe, expect, it } from 'vitest'
import { circuitPose } from './circuitPose'
import {
  createResistivityState,
  fillSamples,
  isSeated,
  liveMeasurement,
  recordDiameter,
  recordPoint,
  seatOnWire,
  setClosed,
  stepGap,
} from './state'

describe('resistivity animation audit', () => {
  it('eases the spindle onto the wire and only then records the diameter', () => {
    const started = seatOnWire(createResistivityState())
    const finished = stepGap(started, started.gapAnim?.dur ?? 1)
    expect(finished.gapAnim).toBeNull()
    expect(isSeated(finished)).toBe(true)
    expect(recordDiameter(createResistivityState()).diameters[0]).toBeNull()
    expect(recordDiameter(finished).diameters[0]?.d).toBeCloseTo(0.404, 6)
  })

  it('drives the meter fractions from a closed circuit and blocks an open switch', () => {
    const open = setClosed(createResistivityState(), true)
    expect(open.closed).toBe(true)
    const reading = liveMeasurement({ ...open, stage: 'circuit' })
    const pose = circuitPose({
      lengthCm: open.lengthCm,
      slider: open.slider,
      closed: true,
      ammeterFraction: reading.Imeter / 0.6,
      voltmeterFraction: reading.Umeter / 3,
      temperatureRise: reading.dT,
    })
    expect(pose.ammeterRotation).not.toBeCloseTo(Math.PI / 4, 3)
    expect(pose.bladeRotation).toBe(0)
    const blocked = setClosed({ ...createResistivityState(), step: 1 }, true)
    expect(blocked.closed).toBe(false)
  })

  it('records meter-rounded points and can fill a fit from the same circuit', () => {
    const closed = { ...createResistivityState(), stage: 'circuit' as const, closed: true, step: 3 }
    const recorded = recordPoint(closed)
    expect(recorded.records).toHaveLength(1)
    expect(recorded.records[0].U).toBeGreaterThan(0)
    const filled = fillSamples(createResistivityState())
    expect(filled.diameters.every(Boolean)).toBe(true)
    expect(filled.records.length).toBeGreaterThan(4)
  })
})
