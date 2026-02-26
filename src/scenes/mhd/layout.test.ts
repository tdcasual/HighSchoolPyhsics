import { describe, expect, it } from 'vitest'
import {
  MHD_LAYOUT,
  areVectorsPerpendicular,
  cross,
  dot,
  normalize,
} from './layout'

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
