type Vec3 = [number, number, number]

export function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

export function cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ]
}

function magnitude(vector: Vec3): number {
  return Math.hypot(vector[0], vector[1], vector[2])
}

export function normalize(vector: Vec3): Vec3 {
  const length = magnitude(vector)
  if (length < 1e-8) {
    return [0, 0, 0]
  }
  return [vector[0] / length, vector[1] / length, vector[2] / length]
}

export function areVectorsPerpendicular(a: Vec3, b: Vec3, tolerance = 1e-6): boolean {
  const normalA = normalize(a)
  const normalB = normalize(b)
  return Math.abs(dot(normalA, normalB)) <= tolerance
}

const topElectrodeCenter: Vec3 = [0, 0.35, 0]
const bottomElectrodeCenter: Vec3 = [0, -0.35, 0]
const electrodeHalfLengthX = 0.95
const loadX = 2.4
const loadZ = 0.6
const topContact: Vec3 = [topElectrodeCenter[0] + electrodeHalfLengthX, topElectrodeCenter[1], 0.54]
const bottomContact: Vec3 = [
  bottomElectrodeCenter[0] + electrodeHalfLengthX,
  bottomElectrodeCenter[1],
  0.54,
]

export const MHD_LAYOUT = {
  flow: {
    direction: [1, 0, 0] as Vec3,
    lanes: [-0.3, 0, 0.3],
    startX: -1.15,
    spanX: 2.3,
    y: 0,
  },
  magneticField: {
    direction: [0, 0, 1] as Vec3,
    xGuides: [-0.72, -0.28, 0.28, 0.72],
    yStart: -0.58,
    yEnd: 0.58,
    zStart: -0.48,
    zEnd: 0.48,
  },
  magnets: {
    northPosition: [0, 0, -1.35] as Vec3,
    southPosition: [0, 0, 1.35] as Vec3,
    size: [1.7, 0.95, 0.9] as Vec3,
  },
  electrodes: {
    axis: [0, 1, 0] as Vec3,
    size: [1.9, 0.08, 1.02] as Vec3,
    topCenter: topElectrodeCenter,
    bottomCenter: bottomElectrodeCenter,
    topRotationY: 0,
    bottomRotationY: 0,
    topContact,
    bottomContact,
  },
  channel: {
    center: [0, 0, 0] as Vec3,
    size: [2.45, 0.52, 1.12] as Vec3,
  },
  load: {
    bodyPosition: [loadX, 0, loadZ] as Vec3,
    bodySize: [0.14, 0.42, 0.18] as Vec3,
    topLead: [loadX, 0.22, loadZ] as Vec3,
    bottomLead: [loadX, -0.22, loadZ] as Vec3,
  },
  wires: {
    top: [
      topContact,
      [1.55, 0.76, 0.68],
      [loadX, 0.76, loadZ],
      [loadX, 0.22, loadZ],
    ] as Vec3[],
    bottom: [
      bottomContact,
      [1.55, -0.76, 0.68],
      [loadX, -0.76, loadZ],
      [loadX, -0.22, loadZ],
    ] as Vec3[],
  },
} as const
