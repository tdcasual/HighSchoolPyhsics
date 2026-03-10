import { describe, expect, it } from 'vitest'
import {
  advanceMotionOffset,
  advanceTravelProgress,
  deriveMotionalEmfReadings,
  formatPolarityText,
  formatVelocityPreset,
  formatRelationText,
  resolveInducedCurrentDirection,
  resolveRodContactOffsets,
  resolveTeachingVectorAnchors,
  resolveWireCurvePoints,
} from './model'

describe('motional-emf model', () => {
  it('returns a positive U_AB for the default orthogonal arrangement with upward magnetic field', () => {
    const result = deriveMotionalEmfReadings({
      magneticFieldT: 1,
      magneticFieldDirection: 'up',
      rodLengthM: 0.5,
      speedMps: 2,
      rodAngleDeg: 90,
      velocityPreset: 'forward',
    })

    expect(result.signedVoltageV).toBeCloseTo(1)
    expect(formatPolarityText(result.signedVoltageV)).toBe('A 端高电势')
  })

  it('flips polarity when the magnetic field direction flips', () => {
    const upward = deriveMotionalEmfReadings({
      magneticFieldT: 1,
      magneticFieldDirection: 'up',
      rodLengthM: 0.5,
      speedMps: 2,
      rodAngleDeg: 90,
      velocityPreset: 'forward',
    })
    const downward = deriveMotionalEmfReadings({
      magneticFieldT: 1,
      magneticFieldDirection: 'down',
      rodLengthM: 0.5,
      speedMps: 2,
      rodAngleDeg: 90,
      velocityPreset: 'forward',
    })

    expect(upward.signedVoltageV).toBeCloseTo(-downward.signedVoltageV)
  })

  it('returns zero when velocity is parallel to magnetic field', () => {
    const upward = deriveMotionalEmfReadings({
      magneticFieldT: 1,
      magneticFieldDirection: 'up',
      rodLengthM: 0.5,
      speedMps: 2,
      rodAngleDeg: 90,
      velocityPreset: 'up',
    })
    const downward = deriveMotionalEmfReadings({
      magneticFieldT: 1,
      magneticFieldDirection: 'up',
      rodLengthM: 0.5,
      speedMps: 2,
      rodAngleDeg: 90,
      velocityPreset: 'down',
    })

    expect(upward.signedVoltageV).toBeCloseTo(0)
    expect(downward.signedVoltageV).toBeCloseTo(0)
  })

  it('labels up/down presets consistently with the downward magnetic field direction', () => {
    expect(formatVelocityPreset('up')).toBe('向上')
    expect(formatVelocityPreset('down')).toBe('向下')
    expect(formatRelationText({ rodAngleDeg: 90, velocityPreset: 'up', magneticFieldDirection: 'up' })).toBe('v ∥ B，L ∥ (v × B)')
    expect(formatRelationText({ rodAngleDeg: 90, velocityPreset: 'up', magneticFieldDirection: 'down' })).toContain('反向')
  })

  it('reduces magnitude for 30/45/60 degree velocity presets', () => {
    const thirty = deriveMotionalEmfReadings({
      magneticFieldT: 1,
      magneticFieldDirection: 'up',
      rodLengthM: 1,
      speedMps: 1,
      rodAngleDeg: 90,
      velocityPreset: 'angle-30',
    })
    const fortyFive = deriveMotionalEmfReadings({
      magneticFieldT: 1,
      magneticFieldDirection: 'up',
      rodLengthM: 1,
      speedMps: 1,
      rodAngleDeg: 90,
      velocityPreset: 'angle-45',
    })
    const sixty = deriveMotionalEmfReadings({
      magneticFieldT: 1,
      magneticFieldDirection: 'up',
      rodLengthM: 1,
      speedMps: 1,
      rodAngleDeg: 90,
      velocityPreset: 'angle-60',
    })

    expect(Math.abs(thirty.signedVoltageV)).toBeLessThan(Math.abs(fortyFive.signedVoltageV))
    expect(Math.abs(fortyFive.signedVoltageV)).toBeLessThan(Math.abs(sixty.signedVoltageV))
  })

  it('flips sign when motion reverses along the rail', () => {
    const forward = deriveMotionalEmfReadings({
      magneticFieldT: 1,
      magneticFieldDirection: 'up',
      rodLengthM: 0.5,
      speedMps: 2,
      rodAngleDeg: 90,
      velocityPreset: 'forward',
    })
    const backward = deriveMotionalEmfReadings({
      magneticFieldT: 1,
      magneticFieldDirection: 'up',
      rodLengthM: 0.5,
      speedMps: 2,
      rodAngleDeg: 90,
      velocityPreset: 'backward',
    })

    expect(forward.signedVoltageV).toBeCloseTo(-backward.signedVoltageV)
  })

  it('returns zero when the rod is parallel to the magnetic field', () => {
    const result = deriveMotionalEmfReadings({
      magneticFieldT: 1,
      magneticFieldDirection: 'up',
      rodLengthM: 0.5,
      speedMps: 2,
      rodAngleDeg: 0,
      velocityPreset: 'forward',
    })

    expect(result.signedVoltageV).toBeCloseTo(0)
  })

  it('moves rod contacts vertically when the rod tilts', () => {
    const contacts = resolveRodContactOffsets({
      visualRodLength: 2.7,
      rodAngleDeg: 45,
    })

    expect(contacts.left[1]).toBeLessThan(0)
    expect(contacts.right[1]).toBeGreaterThan(0)
    expect(Math.abs(contacts.left[1])).toBeGreaterThan(0.8)
  })

  it('advances travel progress one-way and clamps at the end', () => {
    expect(advanceTravelProgress({ previous: 0, deltaS: 0.5, speedMps: 2 })).toBeGreaterThan(0)
    expect(advanceTravelProgress({ previous: 0.95, deltaS: 1, speedMps: 3 })).toBe(1)
  })

  it('accumulates motion offset incrementally instead of reprojecting the rod', () => {
    const next = advanceMotionOffset({
      previous: [0, 0, 1.1],
      deltaS: 0.5,
      speedMps: 2,
      velocityPreset: 'up',
      magneticFieldDirection: 'up',
    })

    expect(next[0]).toBeCloseTo(0)
    expect(next[1]).toBeCloseTo(1)
    expect(next[2]).toBeCloseTo(1.1)
  })

  it('pins both teaching arrows to the rod geometric center', () => {
    const anchors = resolveTeachingVectorAnchors([0.3, -0.2, 1.4])

    expect(anchors.velocity).toEqual([0.3, -0.2, 1.4])
    expect(anchors.current).toEqual([0.3, -0.2, 1.4])
  })

  it('resolves induced current along the rod while moving and hides it when static', () => {
    const moving = resolveInducedCurrentDirection({
      rodAngleDeg: 90,
      velocityPreset: 'forward',
      magneticFieldDirection: 'up',
      activeMotion: true,
    })
    const staticCurrent = resolveInducedCurrentDirection({
      rodAngleDeg: 90,
      velocityPreset: 'forward',
      magneticFieldDirection: 'up',
      activeMotion: false,
    })

    expect(moving[0]).toBeLessThan(0)
    expect(moving[1]).toBeCloseTo(0)
    expect(staticCurrent).toEqual([0, 0, 0])
  })

  it('builds smooth wire guides that sag below the straight line', () => {
    const points = resolveWireCurvePoints({
      start: [-1.3, -0.45, 0],
      end: [-1.05, -1.2, -4.2],
      side: 'left',
    })

    expect(points[0]).toEqual([-1.3, -0.45, 0])
    expect(points.at(-1)).toEqual([-1.05, -1.2, -4.2])
    expect(points).toHaveLength(5)
    expect(points[2][1]).toBeLessThan(-1.2)
  })
})
