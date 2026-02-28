import { describe, expect, it } from 'vitest'
import { MHD_LAYOUT } from './layout'

type Vec3 = [number, number, number]

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ]
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
    expect(
      areVectorsPerpendicular(MHD_LAYOUT.flow.direction, MHD_LAYOUT.magneticField.direction),
    ).toBe(true)
  })

  it('aligns induced electric field direction with electrode axis', () => {
    const inducedFieldDirection = normalize(
      cross(MHD_LAYOUT.flow.direction, MHD_LAYOUT.magneticField.direction),
    )
    const electrodeAxis = normalize(MHD_LAYOUT.electrodes.axis)

    expect(Math.abs(dot(inducedFieldDirection, electrodeAxis))).toBeGreaterThan(0.99)
  })

  it('starts both wires from electrode contact points', () => {
    expect(MHD_LAYOUT.wires.top[0]).toEqual(MHD_LAYOUT.electrodes.topContact)
    expect(MHD_LAYOUT.wires.bottom[0]).toEqual(MHD_LAYOUT.electrodes.bottomContact)
  })

  it('keeps both electrodes visually parallel without odd yaw tilt', () => {
    expect(MHD_LAYOUT.electrodes.topRotationY).toBeCloseTo(0)
    expect(MHD_LAYOUT.electrodes.bottomRotationY).toBeCloseTo(0)
  })
})
