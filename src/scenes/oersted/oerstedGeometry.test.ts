import { describe, expect, it } from 'vitest'
import { COMPASS_PLANE_HEIGHT_M, headingToYawRad, WIRE_RADIUS_M, wireCenterHeightM } from './oerstedGeometry'

describe('Oersted geometry', () => {
  it.each([-50, -25, 0, 25, 50])('keeps the wire surface at the requested minimum clearance for pitch %i°', (pitchDeg) => {
    const pitch = (pitchDeg * Math.PI) / 180
    const direction = { x: 0, y: Math.sin(pitch), z: Math.cos(pitch) }
    const halfLength = 0.18
    const requestedClearance = 0.025
    const centerY = wireCenterHeightM(requestedClearance, direction, halfLength)
    const lowestSurfaceY =
      centerY -
      Math.abs(direction.y) * halfLength -
      WIRE_RADIUS_M * Math.sqrt(1 - direction.y ** 2)

    expect(lowestSurfaceY - COMPASS_PLANE_HEIGHT_M).toBeCloseTo(requestedClearance, 10)
  })

  it('maps geographic north and east headings to the matching horizontal axes', () => {
    expect(headingToYawRad(0)).toBeCloseTo(-Math.PI / 2)
    expect(headingToYawRad(90)).toBeCloseTo(0)
  })
})
