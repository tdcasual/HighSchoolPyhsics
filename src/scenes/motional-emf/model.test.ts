import { describe, expect, it } from 'vitest'
import {
  advanceMotionOffset,
  advanceTravelProgress,
  deriveMotionalEmfReadings,
  formatMotionDirection,
  formatPolarityText,
  formatRelationText,
  formatVelocityPreset,
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
      discussionMode: 'vb',
      velocityPreset: 'forward',
      rodVelocityAngleDeg: 90,
      motionDirection: 'forward',
    })

    expect(result.signedVoltageV).toBeCloseTo(1)
    expect(result.angleBetweenBLDeg).toBeCloseTo(90)
    expect(result.angleBetweenLVDeg).toBeCloseTo(90)
    expect(result.angleBetweenBVDeg).toBeCloseTo(90)
    expect(formatPolarityText(result.signedVoltageV)).toBe('A 端高电势')
  })

  it('returns zero when velocity is parallel to magnetic field in v-B mode', () => {
    const upward = deriveMotionalEmfReadings({
      magneticFieldT: 1,
      magneticFieldDirection: 'up',
      rodLengthM: 0.5,
      speedMps: 2,
      rodAngleDeg: 90,
      discussionMode: 'vb',
      velocityPreset: 'up',
      rodVelocityAngleDeg: 90,
      motionDirection: 'forward',
    })

    expect(upward.signedVoltageV).toBeCloseTo(0)
    expect(upward.angleBetweenBVDeg).toBeCloseTo(0)
    expect(formatVelocityPreset('up')).toBe('向上')
  })

  it('retains the old 30/45/60 degree presets in v-B mode', () => {
    const thirty = deriveMotionalEmfReadings({
      magneticFieldT: 1,
      magneticFieldDirection: 'up',
      rodLengthM: 1,
      speedMps: 1,
      rodAngleDeg: 90,
      discussionMode: 'vb',
      velocityPreset: 'angle-30',
      rodVelocityAngleDeg: 90,
      motionDirection: 'forward',
    })
    const fortyFive = deriveMotionalEmfReadings({
      magneticFieldT: 1,
      magneticFieldDirection: 'up',
      rodLengthM: 1,
      speedMps: 1,
      rodAngleDeg: 90,
      discussionMode: 'vb',
      velocityPreset: 'angle-45',
      rodVelocityAngleDeg: 90,
      motionDirection: 'forward',
    })
    const sixty = deriveMotionalEmfReadings({
      magneticFieldT: 1,
      magneticFieldDirection: 'up',
      rodLengthM: 1,
      speedMps: 1,
      rodAngleDeg: 90,
      discussionMode: 'vb',
      velocityPreset: 'angle-60',
      rodVelocityAngleDeg: 90,
      motionDirection: 'forward',
    })

    expect(Math.abs(thirty.signedVoltageV)).toBeLessThan(Math.abs(fortyFive.signedVoltageV))
    expect(Math.abs(fortyFive.signedVoltageV)).toBeLessThan(Math.abs(sixty.signedVoltageV))
  })

  it('still supports explicit L-v mode and derives the B-v angle from B-L and L-v', () => {
    const result = deriveMotionalEmfReadings({
      magneticFieldT: 1,
      magneticFieldDirection: 'up',
      rodLengthM: 1,
      speedMps: 1,
      rodAngleDeg: 60,
      discussionMode: 'lv',
      velocityPreset: 'forward',
      rodVelocityAngleDeg: 45,
      motionDirection: 'forward',
    })

    expect(result.angleBetweenBLDeg).toBeCloseTo(60)
    expect(result.angleBetweenLVDeg).toBeCloseTo(45)
    expect(result.angleBetweenBVDeg).toBeCloseTo(69.295, 3)
    expect(formatRelationText(result)).toBe('∠(B,L)=60°，∠(L,v)=45°，∠(B,v)=69.3°')
  })

  it('flips sign when motion reverses along the same L-v preset', () => {
    const forward = deriveMotionalEmfReadings({
      magneticFieldT: 1,
      magneticFieldDirection: 'up',
      rodLengthM: 0.5,
      speedMps: 2,
      rodAngleDeg: 90,
      discussionMode: 'lv',
      velocityPreset: 'forward',
      rodVelocityAngleDeg: 90,
      motionDirection: 'forward',
    })
    const backward = deriveMotionalEmfReadings({
      magneticFieldT: 1,
      magneticFieldDirection: 'up',
      rodLengthM: 0.5,
      speedMps: 2,
      rodAngleDeg: 90,
      discussionMode: 'lv',
      velocityPreset: 'forward',
      rodVelocityAngleDeg: 90,
      motionDirection: 'backward',
    })

    expect(forward.signedVoltageV).toBeCloseTo(-backward.signedVoltageV)
    expect(formatMotionDirection('forward')).toBe('标准方向')
    expect(formatMotionDirection('backward')).toBe('反向运动')
  })

  it('returns zero when the rod is parallel to the magnetic field', () => {
    const result = deriveMotionalEmfReadings({
      magneticFieldT: 1,
      magneticFieldDirection: 'up',
      rodLengthM: 0.5,
      speedMps: 2,
      rodAngleDeg: 0,
      discussionMode: 'vb',
      velocityPreset: 'forward',
      rodVelocityAngleDeg: 90,
      motionDirection: 'forward',
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

  it('accumulates motion offset incrementally along the resolved velocity vector', () => {
    const next = advanceMotionOffset({
      previous: [0, 0, 1.1],
      deltaS: 0.5,
      speedMps: 2,
      discussionMode: 'vb',
      velocityPreset: 'forward',
      rodAngleDeg: 90,
      rodVelocityAngleDeg: 90,
      motionDirection: 'forward',
      magneticFieldDirection: 'up',
    })

    expect(next[0]).toBeCloseTo(0)
    expect(next[1]).toBeCloseTo(0)
    expect(next[2]).toBeCloseTo(2.1)
  })

  it('pins both teaching arrows to the rod geometric center', () => {
    const anchors = resolveTeachingVectorAnchors([0.3, -0.2, 1.4])

    expect(anchors.velocity).toEqual([0.3, -0.2, 1.4])
    expect(anchors.current).toEqual([0.3, -0.2, 1.4])
  })

  it('resolves induced current along the rod while moving and hides it when static', () => {
    const moving = resolveInducedCurrentDirection({
      rodAngleDeg: 90,
      discussionMode: 'vb',
      velocityPreset: 'forward',
      rodVelocityAngleDeg: 90,
      motionDirection: 'forward',
      magneticFieldDirection: 'up',
      activeMotion: true,
    })
    const staticCurrent = resolveInducedCurrentDirection({
      rodAngleDeg: 90,
      discussionMode: 'vb',
      velocityPreset: 'forward',
      rodVelocityAngleDeg: 90,
      motionDirection: 'forward',
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
