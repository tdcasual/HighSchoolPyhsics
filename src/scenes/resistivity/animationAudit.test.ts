import { describe, expect, it } from 'vitest'
import type { DataRecord } from './state'
import { circuitPose } from './circuitPose'
import {
  createResistivityState,
  fillSamples,
  groupsOf,
  analysisOf,
  isSeated,
  liveMeasurement,
  recordDiameter,
  recordPoint,
  seatOnWire,
  setClosed,
  stepGap,
} from './state'

describe('resistivity animation and measurement audit', () => {
  it('eases the spindle onto the wire and records corrected and raw readings', () => {
    const started = seatOnWire(createResistivityState())
    const finished = stepGap(started, started.gapAnim?.dur ?? 1)
    expect(finished.gapAnim).toBeNull()
    expect(isSeated(finished)).toBe(true)
    expect(recordDiameter(createResistivityState()).diameters[0]).toBeNull()
    const measured = recordDiameter({ ...finished, zero: 0.006 })
    expect(measured.diameters[0]?.d).toBeCloseTo(0.404, 6)
    expect(measured.diameters[0]?.reading).toBeCloseTo(0.41, 6)
    expect(measured.diameters[0]?.zero).toBe(0.006)
  })

  it('requires a complete circuit and a safe slider before closing', () => {
    const base = { ...createResistivityState(), stage: 'circuit' as const, step: 2 }
    expect(setClosed({ ...base, step: 1 }, true).closed).toBe(false)
    expect(setClosed({ ...base, slider: 0.5 }, true).closed).toBe(false)
    const closed = setClosed({ ...base, slider: 1 }, true)
    expect(closed.closed).toBe(true)
    const reading = liveMeasurement(closed)
    const pose = circuitPose({
      lengthCm: closed.lengthCm,
      slider: closed.slider,
      closed: true,
      ammeterFraction: reading.Imeter / 0.6,
      voltmeterFraction: reading.Umeter / 3,
      temperatureRise: reading.dT,
    })
    expect(pose.ammeterRotation).not.toBeCloseTo(Math.PI / 4, 3)
    expect(pose.bladeRotation).toBe(0)
    expect(setClosed({ ...base, control: 'divider', slider: 0.5 }, true).closed).toBe(false)
    expect(setClosed({ ...base, control: 'divider', slider: 0 }, true).closed).toBe(true)
  })

  it('records meter-rounded points with their circuit configuration', () => {
    const closed = { ...createResistivityState(), stage: 'circuit' as const, closed: true, step: 2 }
    const recorded = recordPoint(closed)
    expect(recorded.records).toHaveLength(1)
    expect(recorded.records[0].U).toBeGreaterThan(0)
    expect(recorded.records[0].ammeter).toBe('A06')
    expect(recorded.records[0].voltmeter).toBe('V3')
  })

  it('keeps graph groups separate when the control or meter range changes', () => {
    const row: DataRecord = {
      wire: 'nichrome@0.4',
      wireName: '镍铬合金',
      method: 'external',
      control: 'limit',
      ammeter: 'A06',
      voltmeter: 'V3',
      l: 50,
      U: 1,
      I: 0.1,
      source: '测量',
    }
    const differentRange = { ...row, ammeter: 'A3' as const, U: 1.2, I: 0.12 }
    const differentControl = { ...row, control: 'divider' as const, U: 1.4, I: 0.14 }
    expect(groupsOf([row, differentRange]).ui).toEqual([differentRange])
    expect(groupsOf([row, differentControl]).ui).toEqual([differentControl])
  })

  it('waits for all three diameter measurements before reporting resistivity and identifies the unknown sample', () => {
    const complete = fillSamples(createResistivityState())
    const partial = { ...complete, diameters: [complete.diameters[0], null, null] as typeof complete.diameters }
    expect(analysisOf(partial).diameterCount).toBe(1)
    expect(analysisOf(partial).rho).toBeNull()
    const solved = analysisOf(complete)
    expect(solved.diameterComplete).toBe(true)
    expect(solved.rho).toBeGreaterThan(0)
    const unknownSample = fillSamples({ ...createResistivityState(), mystery: true })
    expect(analysisOf(unknownSample).nearest?.key).toBe('constantan')
  })

  it('fills explicitly marked example diameters and readings without changing the live switch', () => {
    const base = createResistivityState()
    const filled = fillSamples(base)
    expect(filled.diameters.every(Boolean)).toBe(true)
    expect(filled.diameters[0]?.source).toBe('示例')
    expect(filled.records.length).toBeGreaterThan(4)
    expect(
      filled.records.every((row) => row.source === '示例' && row.ammeter === 'A06' && row.voltmeter === 'V3'),
    ).toBe(true)
    expect(filled.closed).toBe(false)
  })
})
