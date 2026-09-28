import { describe, expect, it } from 'vitest'
import { Ray, Vector3 } from 'three'
import { axisDragDelta, createAxisDragPlane } from './axisDrag'

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
