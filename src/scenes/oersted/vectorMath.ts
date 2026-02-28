export type Vec3 = {
  x: number
  y: number
  z: number
}

export function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z
}

export function cross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  }
}

export function length(v: Vec3): number {
  return Math.hypot(v.x, v.y, v.z)
}

export function normalize(v: Vec3): Vec3 {
  const size = length(v)
  if (size < 1e-12) {
    return { x: 0, y: 0, z: 1 }
  }
  return {
    x: v.x / size,
    y: v.y / size,
    z: v.z / size,
  }
}

export function add(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }
}

export function scale(v: Vec3, scalar: number): Vec3 {
  return { x: v.x * scalar, y: v.y * scalar, z: v.z * scalar }
}

export function sub(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }
}
