import { BoxGeometry, Group, Mesh } from 'three'
import { describe, expect, it } from 'vitest'
import { NO_FIT } from '../FitBounds'
import { measureBounds } from '../measureBounds'

function box(size: number, x = 0) {
  const mesh = new Mesh(new BoxGeometry(size, size, size))
  mesh.position.x = x
  return mesh
}

describe('measureBounds', () => {
  it('measures every mesh in world space, through nested transforms', () => {
    const root = new Group()
    const arm = new Group()
    arm.position.set(0, 3, 0)
    arm.add(box(2, 4))
    root.add(box(2), arm)
    expect(measureBounds(root)).toEqual({ min: [-1, -1, -1], max: [5, 4, 1] })
  })

  it('skips NO_FIT objects (with their children) and hidden ones', () => {
    const root = new Group()
    const floor = box(100)
    floor.userData = { ...NO_FIT }
    floor.add(box(1, 60))
    const hidden = box(10, -30)
    hidden.visible = false
    root.add(box(2), floor, hidden)
    expect(measureBounds(root)).toEqual({ min: [-1, -1, -1], max: [1, 1, 1] })
  })

  it('reports nothing for a scene with no geometry yet', () => {
    expect(measureBounds(new Group())).toBeNull()
  })
})
