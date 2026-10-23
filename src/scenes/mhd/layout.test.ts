import { describe, expect, it } from 'vitest'
import { deriveMhdLayout, MHD_LAYOUT } from './layout'

type Vec3 = [number, number, number]

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}

function normalize(vector: Vec3): Vec3 {
  const length = Math.hypot(vector[0], vector[1], vector[2])
  if (length < 1e-8) {
    return [0, 0, 0]
  }
  return [vector[0] / length, vector[1] / length, vector[2] / length]
}

function areVectorsPerpendicular(a: Vec3, b: Vec3, tolerance = 1e-6): boolean {
  const normalA = normalize(a)
  const normalB = normalize(b)
  return Math.abs(dot(normalA, normalB)) <= tolerance
}

describe('mhd layout', () => {
  it('keeps plasma flow perpendicular to magnetic field', () => {
    expect(areVectorsPerpendicular(MHD_LAYOUT.flow.direction, MHD_LAYOUT.magneticField.direction)).toBe(true)
  })

  it('aligns induced electric field direction with electrode axis', () => {
    const inducedFieldDirection = normalize(
      cross(MHD_LAYOUT.flow.direction, MHD_LAYOUT.magneticField.direction).map((component) => -component) as Vec3,
    )
    const electrodeAxis = normalize(MHD_LAYOUT.electrodes.axis)

    expect(dot(inducedFieldDirection, electrodeAxis)).toBeGreaterThan(0.99)
    expect(
      dot(normalize(cross(MHD_LAYOUT.flow.direction, MHD_LAYOUT.magneticField.direction)), electrodeAxis),
    ).toBeLessThan(-0.99)
  })

  it('starts both wires from electrode contact points', () => {
    expect(MHD_LAYOUT.wires.top[0]).toEqual(MHD_LAYOUT.electrodes.topContact)
    expect(MHD_LAYOUT.wires.bottom[0]).toEqual(MHD_LAYOUT.electrodes.bottomContact)
  })

  it('keeps external-wire contacts on the electrode footprint', () => {
    for (const gap of [0.1, 0.4, 1]) {
      const layout = deriveMhdLayout(gap)
      for (const [contact, plateCenter] of [
        [layout.electrodes.topContact, layout.electrodes.topCenter],
        [layout.electrodes.bottomContact, layout.electrodes.bottomCenter],
      ] as const) {
        expect(Math.abs(contact[0])).toBeCloseTo(layout.electrodes.size[0] / 2)
        expect(Math.abs(contact[1] - plateCenter[1])).toBeCloseTo(0)
        expect(Math.abs(contact[2])).toBeLessThanOrEqual(layout.electrodes.size[2] / 2)
      }
    }
  })

  it('moves plates, channel and leads when the electrode-gap control changes', () => {
    const narrow = deriveMhdLayout(0.1)
    const wide = deriveMhdLayout(1)

    expect(wide.channel.size[1]).toBeGreaterThan(narrow.channel.size[1])
    expect(wide.electrodes.topCenter[1]).toBeGreaterThan(narrow.electrodes.topCenter[1])
    expect(narrow.wires.top[0]).toEqual(narrow.electrodes.topContact)
    expect(wide.wires.bottom[0]).toEqual(wide.electrodes.bottomContact)
  })

  it('keeps the electric-field arrows inside the minimum electrode gap', () => {
    const minimumGap = deriveMhdLayout(0.1)
    expect(minimumGap.magneticField.yStart).toBeLessThan(minimumGap.magneticField.yEnd)
    expect(minimumGap.magneticField.yEnd).toBeLessThan(minimumGap.channel.size[1] / 2)
  })

  it('keeps both electrodes visually parallel without odd yaw tilt', () => {
    expect(MHD_LAYOUT.electrodes.topRotationY).toBeCloseTo(0)
    expect(MHD_LAYOUT.electrodes.bottomRotationY).toBeCloseTo(0)
  })
})
