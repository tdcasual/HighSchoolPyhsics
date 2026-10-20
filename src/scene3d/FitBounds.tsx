import { useLayoutEffect, useRef, type PropsWithChildren } from 'react'
import { Box3, type Group, type Object3D } from 'three'
import type { Bounds3 } from './orbitFraming'

/** Excludes an object (and its children) from FitBounds: a floor, a sky dome, a field-line cloud. */
export const NO_FIT = { noFit: true } as const

function measure(root: Object3D): Bounds3 | null {
  // Outside a three.js renderer (a test that mocks the canvas) there is nothing to measure.
  if (typeof root.updateWorldMatrix !== 'function') return null
  root.updateWorldMatrix(true, true)
  const total = new Box3()
  const part = new Box3()
  const visit = (object: Object3D) => {
    if (object.userData.noFit || !object.visible) return
    const geometry = (object as Object3D & { geometry?: { boundingBox: Box3 | null; computeBoundingBox: () => void } }).geometry
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

const SETTLE_MS = [150, 600, 1500]

const close = (a: Bounds3 | null, b: Bounds3) =>
  a !== null && [0, 1, 2].every((axis) => Math.abs(a.min[axis] - b.min[axis]) < 1e-3 && Math.abs(a.max[axis] - b.max[axis]) < 1e-3)

/**
 * Measures the world bounds of its children when the scene opens and whenever `refitKey`
 * changes (a view preset, another apparatus), settling over the first second, and reports them to useAutoFittedCamera. Moving
 * parts are measured where they start; later motion never reframes the camera. Mark objects
 * that should not count (floor, grids, long field lines) with `userData={NO_FIT}`.
 */
export function FitBounds({ refitKey, onBounds, children }: PropsWithChildren<{ refitKey: string; onBounds: (bounds: Bounds3) => void }>) {
  const group = useRef<Group>(null)
  const last = useRef<Bounds3 | null>(null)
  useLayoutEffect(() => {
    const update = () => {
      if (!group.current) return
      const next = measure(group.current)
      if (!next || close(last.current, next)) return
      last.current = next
      onBounds(next)
    }
    update()
    // Parts that load asynchronously (text, textures, suspended models) join within the first
    // second; measure again then, and never afterwards for this refitKey.
    const timers = SETTLE_MS.map((delay) => window.setTimeout(update, delay))
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [refitKey, onBounds])
  return <group ref={group}>{children}</group>
}
