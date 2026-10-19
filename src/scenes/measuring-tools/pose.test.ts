import { describe, expect, it } from 'vitest'
import { MICROMETER_PITCH_MM } from './model'
import {
  cameraLimits,
  caliperPose,

  instrumentBounds,
  instrumentView,
  micrometerPose,
  orbitPosition,
  type InstrumentViewInput,
  type Vec3,
} from './pose'

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
    // Zero error moves the thimble edge together with its scale: edge = 0 line + indicated reading.
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

  it('fits every corner of the active instrument into its unobstructed viewport', () => {
    const cases: InstrumentViewInput[] = [
      { tool: 'caliper', mode: 'outer', preset: 'home', caliperX: 75, reading: 0, aspect: 0.5 },
      { tool: 'caliper', mode: 'depth', preset: 'home', caliperX: 150, reading: 0, caliperExplode: 1, showWork: true, workSize: 150, aspect: 0.4 },
      { tool: 'caliper', mode: 'depth', preset: 'focus', caliperX: 150, reading: 0, caliperExplode: 1, showWork: true, workSize: 150, aspect: 0.45 },
      { tool: 'micrometer', mode: 'outer', preset: 'home', caliperX: 0, reading: 25, micrometerExplode: 1, showWork: true, workSize: 25, aspect: 0.35 },
      { tool: 'micrometer', mode: 'outer', preset: 'focus', caliperX: 0, reading: 25, aspect: 0.4 },
      { tool: 'micrometer', mode: 'outer', preset: 'focus', caliperX: 0, reading: 25, showWork: true, workSize: 25, aspect: 0.4 },
    ]

    for (const input of cases) {
      const view = instrumentView(input)
      const box = instrumentBounds(input)
      const fovTangent = Math.tan((cameraLimits(input.tool).fov * Math.PI) / 360)
      const horizontalTangent = fovTangent * (input.aspect ?? 16 / 9)
      const cosine = Math.cos(view.elevation)
      const forward: Vec3 = [cosine * Math.sin(view.azimuth), Math.sin(view.elevation), cosine * Math.cos(view.azimuth)]
      const right: Vec3 = [Math.cos(view.azimuth), 0, -Math.sin(view.azimuth)]
      const up: Vec3 = [-Math.sin(view.elevation) * Math.sin(view.azimuth), cosine, -Math.sin(view.elevation) * Math.cos(view.azimuth)]
      const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

      for (const x of [box.min[0], box.max[0]]) {
        for (const y of [box.min[1], box.max[1]]) {
          for (const z of [box.min[2], box.max[2]]) {
            const relative: Vec3 = [x - view.target[0], y - view.target[1], z - view.target[2]]
            const cameraDepth = view.radius - dot(relative, forward)
            expect(cameraDepth).toBeGreaterThan(0)
            const fitMargin = input.preset === 'focus' ? 1 : input.tool === 'micrometer' ? 1 : 1.07
            expect(Math.abs(dot(relative, right)) / cameraDepth).toBeLessThan(horizontalTangent / fitMargin + 1e-10)
            expect(Math.abs(dot(relative, up)) / cameraDepth).toBeLessThan(fovTangent / fitMargin + 1e-10)
          }
        }
      }
    }
  })

  it('fits the rotated depth view at wide and narrow aspect ratios', () => {
    const wide = instrumentView({ tool: 'caliper', mode: 'depth', preset: 'focus', caliperX: 80, reading: 0, aspect: 1.2 })
    const narrow = instrumentView({ tool: 'caliper', mode: 'depth', preset: 'focus', caliperX: 80, reading: 0, aspect: 0.22 })
    const wideBounds = instrumentBounds({ tool: 'caliper', mode: 'depth', preset: 'focus', caliperX: 80, reading: 0 })
    expect(wide.target[1]).toBeCloseTo((wideBounds.min[1] + wideBounds.max[1]) / 2, 8)
    expect(narrow.radius).toBeGreaterThan(wide.radius)

    const nearEnd = instrumentBounds({ tool: 'caliper', mode: 'depth', preset: 'home', caliperX: 150, reading: 0 })
    expect(nearEnd.min[1]).toBeLessThanOrEqual(215 - (150 + 74))
    expect(nearEnd.max[1]).toBeGreaterThanOrEqual(215 - (150 - 24))
  })

  it('covers the full physical bounds in overview and the scale region in focus', () => {
    const expanded = instrumentBounds({
      tool: 'caliper',
      mode: 'outer',
      preset: 'home',
      caliperX: 150,
      reading: 0,
      caliperExplode: 1,
      showWork: true,
      workSize: 150,
    })
    expect(expanded.min[0]).toBeLessThanOrEqual(-30)
    expect(expanded.max[0]).toBeGreaterThanOrEqual(220)
    expect(expanded.min[2]).toBeLessThanOrEqual(-54)

    const micrometer = instrumentBounds({
      tool: 'micrometer',
      mode: 'outer',
      preset: 'home',
      caliperX: 0,
      reading: 25,
      micrometerExplode: 1,
    })
    expect(micrometer.min[0]).toBeLessThanOrEqual(-50)
    expect(micrometer.max[0]).toBeGreaterThanOrEqual(125)
  })

  it('uses a close reading window for the scale preset', () => {
    const caliperInput: InstrumentViewInput = {
      tool: 'caliper', mode: 'inner', preset: 'home', caliperX: 23.45, reading: 0, showWork: true, workSize: 23.45,
    }
    const caliperHome = instrumentBounds(caliperInput)
    const caliperFocus = instrumentBounds({ ...caliperInput, preset: 'focus' })
    expect(caliperFocus.max[0] - caliperFocus.min[0]).toBeLessThan((caliperHome.max[0] - caliperHome.min[0]) / 4)
    expect(caliperFocus.min[0]).toBeGreaterThan(caliperHome.min[0])
    expect(caliperFocus.max[1]).toBeGreaterThan(45)

    const micrometerInput: InstrumentViewInput = {
      tool: 'micrometer', mode: 'outer', preset: 'home', caliperX: 0, reading: 12,
    }
    const micrometerHome = instrumentBounds(micrometerInput)
    const micrometerFocus = instrumentBounds({ ...micrometerInput, preset: 'focus' })
    expect(micrometerFocus.max[0] - micrometerFocus.min[0]).toBeLessThan((micrometerHome.max[0] - micrometerHome.min[0]) * 0.55)
  })

  it('frames the whole vernier, including its last line, in the caliper scale preset', () => {
    for (const span of [9, 19, 49]) {
      const focus = instrumentBounds({ tool: 'caliper', mode: 'outer', preset: 'focus', caliperX: 40, vernierSpan: span, reading: 0 })
      expect(focus.min[0]).toBeLessThan(40)
      expect(focus.max[0]).toBeGreaterThan(40 + span + 4)
    }
  })

  it('includes the maximum depth-slot workpiece in the focused camera bounds', () => {
    const focused = instrumentBounds({
      tool: 'caliper', mode: 'depth', preset: 'focus', caliperX: 150, reading: 0, showWork: true, workSize: 150,
    })
    expect(focused.min[0]).toBeLessThanOrEqual(-23)
    expect(focused.max[0]).toBeGreaterThanOrEqual(38)
    expect(focused.min[1]).toBeLessThanOrEqual(-151)
    expect(focused.max[1]).toBeGreaterThanOrEqual(1)
  })

  it('includes the maximum micrometer specimen in the focused camera bounds', () => {
    const focused = instrumentBounds({
      tool: 'micrometer', mode: 'outer', preset: 'focus', caliperX: 0, reading: 25, showWork: true, workSize: 25,
    })
    expect(focused.min[0]).toBeLessThanOrEqual(0)
    expect(focused.max[0]).toBeGreaterThanOrEqual(25)
    expect(focused.min[1]).toBeLessThan(-14)
    expect(focused.max[1]).toBeGreaterThan(14)
  })

  it('keeps a depth-scale close-up independent of the distant workpiece', () => {
    const focused = instrumentBounds({
      tool: 'caliper', mode: 'depth', preset: 'focus', caliperX: 70, reading: 0, showWork: false, workSize: 100,
    })
    expect(focused.max[1] - focused.min[1]).toBeLessThan(50)
  })

  it('places the camera at the fitted orbit radius', () => {
    const view = instrumentView({ tool: 'caliper', mode: 'outer', preset: 'home', caliperX: 0, reading: 0 })
    const position = orbitPosition(view)
    const distance = Math.hypot(
      position[0] - view.target[0],
      position[1] - view.target[1],
      position[2] - view.target[2],
    )
    expect(distance).toBeCloseTo(view.radius, 8)
  })

  it('keeps the top and front presets distinct', () => {
    const top = instrumentView({ tool: 'micrometer', mode: 'outer', preset: 'top', caliperX: 0, reading: 0 })
    const front = instrumentView({ tool: 'micrometer', mode: 'outer', preset: 'front', caliperX: 0, reading: 0 })
    expect(top.elevation).toBeGreaterThan(0.8)
    expect(top.elevation).toBeLessThan(Math.PI / 2)
    expect(front.elevation).toBe(0.03)
  })
})
