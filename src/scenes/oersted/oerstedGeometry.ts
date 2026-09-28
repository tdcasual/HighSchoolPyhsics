import { normalize, type Vec3 } from './vectorMath'

export const COMPASS_PLANE_HEIGHT_M = 0.01
export const WIRE_RADIUS_M = 0.005

export function headingToYawRad(headingDeg: number): number {
  return ((headingDeg - 90) * Math.PI) / 180
}

export function wireCenterHeightM(
  minimumSurfaceClearanceM: number,
  wireDirection: Vec3,
  wireHalfLengthM: number,
): number {
  const direction = normalize(wireDirection)
  const halfLength = Math.max(0, wireHalfLengthM)
  const radialVerticalExtent = WIRE_RADIUS_M * Math.sqrt(Math.max(0, 1 - direction.y ** 2))
  return (
    COMPASS_PLANE_HEIGHT_M +
    Math.max(0, minimumSurfaceClearanceM) +
    Math.abs(direction.y) * halfLength +
    radialVerticalExtent
  )
}
