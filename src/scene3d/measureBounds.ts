import { Box3, type Object3D } from 'three'
import type { Bounds3 } from './orbitFraming'

/** World bounds of everything under `root` that has geometry, skipping hidden and NO_FIT objects. */
export function measureBounds(root: Object3D): Bounds3 | null {
  // Outside a three.js renderer (a test that mocks the canvas) there is nothing to measure.
  if (typeof root.updateWorldMatrix !== 'function') return null
  root.updateWorldMatrix(true, true)
  const total = new Box3()
  const part = new Box3()
  const visit = (object: Object3D) => {
    if (object.userData.noFit || !object.visible) return
    const geometry = (object as Object3D & { geometry?: { boundingBox: Box3 | null; computeBoundingBox: () => void } })
      .geometry
    if (geometry) {
      if (!geometry.boundingBox) geometry.computeBoundingBox()
      if (geometry.boundingBox && !geometry.boundingBox.isEmpty()) {
        part.copy(geometry.boundingBox).applyMatrix4(object.matrixWorld)
        total.union(part)
      }
    }
    object.children.forEach(visit)
  }
  visit(root)
  if (total.isEmpty()) return null
  return { min: [total.min.x, total.min.y, total.min.z], max: [total.max.x, total.max.y, total.max.z] }
}
