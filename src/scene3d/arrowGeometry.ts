import { Quaternion, Vector3 } from 'three'

export type ArrowPoint = readonly [number, number, number]

export type ArrowGeometry = {
  /** Where the shaft ends and the head's base sits. */
  base: [number, number, number]
  shaftLength: number
  shaftCenter: [number, number, number]
  headLength: number
  headCenter: [number, number, number]
  /** Turns the +Y axis (three's cone and cylinder axis) onto the arrow. */
  quaternion: Quaternion
}

const Y_AXIS = new Vector3(0, 1, 0)

/**
 * Shaft and head of an arrow from `from` (tail) to `to` (tip): the head takes the last
 * `headLength` (all of it on a short arrow). Null for a zero-length arrow.
 */
export function arrowGeometry(from: ArrowPoint, to: ArrowPoint, headLength: number): ArrowGeometry | null {
  const direction = new Vector3(to[0] - from[0], to[1] - from[1], to[2] - from[2])
  const length = direction.length()
  if (length < 1e-6) return null
  direction.divideScalar(length)
  const head = Math.min(headLength, length)
  const shaftLength = length - head
  const along = (distance: number): [number, number, number] => [
    from[0] + direction.x * distance,
    from[1] + direction.y * distance,
    from[2] + direction.z * distance,
  ]
  return {
    base: along(shaftLength),
    shaftLength,
    shaftCenter: along(shaftLength / 2),
    headLength: head,
    headCenter: along(shaftLength + head / 2),
    quaternion: new Quaternion().setFromUnitVectors(Y_AXIS, direction),
  }
}

/** The point `distance` past `to` on the line from `from`: the tip of an arrow whose head is centred on `to`. */
export function extendBeyond(from: ArrowPoint, to: ArrowPoint, distance: number): [number, number, number] {
  const d = [to[0] - from[0], to[1] - from[1], to[2] - from[2]]
  const length = Math.hypot(d[0], d[1], d[2])
  if (length < 1e-9) return [to[0], to[1], to[2]]
  return [to[0] + (d[0] / length) * distance, to[1] + (d[1] / length) * distance, to[2] + (d[2] / length) * distance]
}
