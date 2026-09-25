import { describe, expect, it } from 'vitest'
import { MICROMETER_PITCH_MM } from './model'
import { caliperPose, instrumentView, micrometerPose, orbitPosition } from './pose'

describe('measuring-tools poses', () => {
  it('places the caliper frame, rod and screw from the reference update()', () => {
    const closed = caliperPose({ x: 23.4, exploded: 0, locked: false, mode: 'outer' })
    expect(closed.frame).toEqual([23.4, 0, 0])
    expect(closed.rodZ).toBeCloseTo(-1.05, 8)
    expect(closed.screw).toEqual([34, 20, 0.2])
    expect(closed.screwHeadRotationY).toBe(0)
    expect(closed.rootRotationZ).toBe(0)
    expect(closed.rootPosition).toEqual([0, 0, 0])
    expect(closed.groundY).toBe(-62)

    const open = caliperPose({ x: 23.4, exploded: 0.5, locked: true, mode: 'depth' })
    expect(open.frame).toEqual([23.4, 0, 15])
    expect(open.rodZ).toBeCloseTo(-23.05, 8)
    expect(open.screw[1]).toBe(26)
    expect(open.screwHeadRotationY).toBe(0.9)
    expect(open.rootRotationZ).toBeCloseTo(-Math.PI / 2, 8)
    expect(open.rootPosition).toEqual([0, 215, 0])
    expect(open.groundY).toBe(-46)
    expect(open.depthRoot).toEqual([7.8, 0, -23])
  })

  it('spins the thimble one turn per 0.5 mm and shifts the spindle with the gap', () => {
    const pose = micrometerPose({ gap: 1.25, zero: 0.01, exploded: 0, locked: false })
    expect(pose.reading).toBeCloseTo(1.26, 8)
    expect(pose.thimbleX).toBeCloseTo(45.26, 8)
    expect(pose.thimbleRotationX).toBeCloseTo((2 * Math.PI * 1.26) / MICROMETER_PITCH_MM, 8)
    expect(pose.spindleX).toBeCloseTo(23.25, 8)
    expect(pose.spindleTipX).toBeCloseTo(1.65, 8)
    expect(pose.anvilX).toBeCloseTo(-4.5, 8)
    expect(pose.sleeveX).toBeCloseTo(57.5, 8)
    expect(pose.leverRotationY).toBe(0)

    const exploded = micrometerPose({ gap: 1.25, zero: 0.01, exploded: 1, locked: true })
    expect(exploded.thimbleX).toBeCloseTo(61.26, 8)
    expect(exploded.spindleX).toBeCloseTo(31.25, 8)
    expect(exploded.anvilX).toBeCloseTo(-18.5, 8)
    expect(exploded.sleeveX).toBeCloseTo(65.5, 8)
    expect(exploded.sleeveScaleX).toBe(8)
    expect(exploded.lock[1]).toBeCloseTo(16.4, 8)
    expect(exploded.leverRotationY).toBe(-1.2)
    expect(exploded.objectZ).toBe(-30)
  })

  it('builds the home camera with the reference azimuth, elevation and radius', () => {
    const view = instrumentView({ tool: 'caliper', mode: 'outer', preset: 'home', caliperX: 0, reading: 0 })
    expect(view).toEqual({ target: [95, -4, 0], azimuth: 0.12, elevation: 0.3, radius: 300 })
    const cosine = Math.cos(0.3)
    expect(orbitPosition(view)).toEqual([
      95 + 300 * cosine * Math.sin(0.12),
      -4 + 300 * Math.sin(0.3),
      300 * cosine * Math.cos(0.12),
    ])
  })

  it('uses the depth and focus presets instead of the flat home view', () => {
    expect(instrumentView({ tool: 'caliper', mode: 'depth', preset: 'home', caliperX: 10, reading: 0 }).radius).toBe(640)
    expect(instrumentView({ tool: 'caliper', mode: 'outer', preset: 'focus', caliperX: 40, reading: 0 }).target).toEqual([56, 2, 0])
    expect(instrumentView({ tool: 'micrometer', mode: 'outer', preset: 'focus', caliperX: 0, reading: 5.2 }).target[0]).toBeCloseTo(48.2, 8)
    expect(instrumentView({ tool: 'micrometer', mode: 'outer', preset: 'top', caliperX: 0, reading: 0 }).elevation).toBe(1.45)
  })
})
