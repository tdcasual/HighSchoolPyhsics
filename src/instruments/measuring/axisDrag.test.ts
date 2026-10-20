import { describe, expect, it } from 'vitest'
import { Ray, Vector3 } from 'three'
import { axisDragDelta, createAxisDragPlane, thimbleTurn } from './axisDrag'

function rayToCanvasPoint(x: number, y: number): Ray {
  return new Ray(new Vector3(x, y, 10), new Vector3(0, 0, -1))
}

describe('measuring-tool direct-axis dragging', () => {
  it('maps horizontal pointer motion to the caliper axis in the home view', () => {
    const drag = createAxisDragPlane(new Vector3(0, 0, 0), new Vector3(0, 0, -1), new Vector3(1, 0, 0))
    expect(drag).not.toBeNull()
    expect(axisDragDelta(rayToCanvasPoint(12, 0), drag!)).toBeCloseTo(12)
  })

  it('follows the rotated local axis in depth view', () => {
    const drag = createAxisDragPlane(new Vector3(0, 0, 0), new Vector3(0, 0, -1), new Vector3(0, -1, 0))
    expect(drag).not.toBeNull()
    expect(axisDragDelta(rayToCanvasPoint(0, -8), drag!)).toBeCloseTo(8)
  })

  it('corrects for the part of the scale axis pointing into the camera', () => {
    const drag = createAxisDragPlane(new Vector3(0, 0, 0), new Vector3(0, 0, 1), new Vector3(0.6, 0, 0.8))
    expect(drag).not.toBeNull()
    expect(axisDragDelta(rayToCanvasPoint(6, 0), drag!)).toBeCloseTo(10)
  })

  it('declines direct dragging when the scale axis is almost edge-on', () => {
    const drag = createAxisDragPlane(new Vector3(0, 0, 0), new Vector3(0, 0, 1), new Vector3(0, 0, 1))
    expect(drag).toBeNull()
  })
})

describe('micrometer thimble turning', () => {
  it('advances one pitch per circumference of surface travel', () => {
    const turn = thimbleTurn(new Vector3(30, 0, 7.1), 0.5)!
    expect(turn.mmPerSurfaceMm * 2 * Math.PI * 7.1).toBeCloseTo(0.5)
    // About 0.89 mm of surface per 0.01 mm division: big, easy-to-follow pointer motion.
    expect(0.01 / turn.mmPerSurfaceMm).toBeCloseTo(0.892, 2)
  })

  it('turns toward a larger reading when the front surface moves down', () => {
    // The thimble rotates about +x by 2π·reading/pitch, so the point facing the camera (+z) moves to −y.
    const turn = thimbleTurn(new Vector3(30, 0, 7.1), 0.5)!
    expect(turn.tangent.y).toBeCloseTo(-1)
    expect(turn.tangent.z).toBeCloseTo(0)
  })

  it('declines points on the axis', () => {
    expect(thimbleTurn(new Vector3(30, 0, 0), 0.5)).toBeNull()
  })
})
