export type DynamicCircleMode = 'scaling' | 'rotating' | 'translating' | 'comprehensive'
export type BoundaryType = 'straight' | 'triangle' | 'circle'

export type TrajectoryPoint = { x: number; y: number }

export type DynamicCircleReadings = {
  radius: number
  cyclotronPeriod: number
  angularSpeed: number
  deflectionDeg: number
  criticalRadius: number
  boundaryDistance: number
  hitBoundary: boolean
  status: 'safe' | 'critical' | 'escaped'
  center: TrajectoryPoint
  particle: TrajectoryPoint
  trajectory: TrajectoryPoint[]
}

const EPSILON = 1e-4
const X0 = 250

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function radiusFromField(speed: number, field: number, qOverM = 1): number {
  return Math.abs(speed) / Math.max(EPSILON, Math.abs(qOverM * field))
}

function pointInTriangle(point: TrajectoryPoint, triangle: TrajectoryPoint[]): boolean {
  const [a, b, c] = triangle
  const sign = (p1: TrajectoryPoint, p2: TrajectoryPoint, p3: TrajectoryPoint) =>
    (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y)
  const d1 = sign(point, a, b)
  const d2 = sign(point, b, c)
  const d3 = sign(point, c, a)
  const hasNegative = d1 < 0 || d2 < 0 || d3 < 0
  const hasPositive = d1 > 0 || d2 > 0 || d3 > 0
  return !(hasNegative && hasPositive)
}

function boundaryContains(point: TrajectoryPoint, input: {
  boundary: BoundaryType
  xBound: number
  triangleX: number
  triangleHeight: number
  circleCenter: TrajectoryPoint
  circleRadius: number
  y0: number
}): boolean {
  if (input.boundary === 'straight') return point.x <= input.xBound
  if (input.boundary === 'circle') {
    return Math.hypot(point.x - input.circleCenter.x, point.y - input.circleCenter.y) <= input.circleRadius
  }
  const h = input.triangleHeight
  const triangle = [
    { x: X0, y: input.y0 - h / 2 },
    { x: input.triangleX, y: input.y0 },
    { x: X0, y: input.y0 + h / 2 },
  ]
  return pointInTriangle(point, triangle)
}

export function buildTrajectory(input: {
  B: number
  v: number
  thetaDeg: number
  y0: number
  elapsed: number
  mode: DynamicCircleMode
  sweep: boolean
}): { trajectory: TrajectoryPoint[]; center: TrajectoryPoint; particle: TrajectoryPoint; deflectionDeg: number } {
  const phase = input.sweep ? Math.sin(input.elapsed * 0.85) : 0
  const effectiveV = input.mode === 'scaling' || input.mode === 'comprehensive' ? input.v * (1 + phase * 0.12) : input.v
  const effectiveB = input.B === 0 ? 0 : input.B * (input.mode === 'scaling' || input.mode === 'comprehensive' ? 1 + phase * 0.08 : 1)
  const radius = radiusFromField(effectiveV, effectiveB)
  const sign = effectiveB >= 0 ? 1 : -1
  const theta = (input.mode === 'rotating' || input.mode === 'comprehensive')
    ? input.thetaDeg * Math.PI / 180
    : 0
  const injectionY = input.mode === 'translating' || input.mode === 'comprehensive'
    ? input.y0
    : 330
  const center = effectiveB === 0
    ? { x: X0 + radius, y: injectionY }
    : { x: X0 + sign * radius * Math.sin(theta), y: injectionY - sign * radius * Math.cos(theta) }
  const startAngle = effectiveB === 0 ? 0 : Math.atan2(injectionY - center.y, X0 - center.x)
  const travel = effectiveB === 0 ? 0 : input.elapsed * Math.abs(effectiveB) * 8
  const maxTravel = Math.PI * 1.72
  const activeTravel = clamp(travel % maxTravel, 0, maxTravel)
  const trajectory: TrajectoryPoint[] = []
  const sampleCount = 180
  for (let i = 0; i <= sampleCount; i += 1) {
    const amount = maxTravel * i / sampleCount
    if (effectiveB === 0) {
      trajectory.push({ x: X0 + effectiveV * amount * 0.18, y: injectionY })
    } else {
      const angle = startAngle - sign * amount
      trajectory.push({ x: center.x + radius * Math.cos(angle), y: center.y + radius * Math.sin(angle) })
    }
  }
  const particle = effectiveB === 0
    ? { x: X0 + effectiveV * activeTravel * 0.18, y: injectionY }
    : (() => {
      const angle = startAngle - sign * activeTravel
      return { x: center.x + radius * Math.cos(angle), y: center.y + radius * Math.sin(angle) }
    })()
  return { trajectory, center, particle, deflectionDeg: activeTravel * 180 / Math.PI }
}

export function deriveDynamicReadings(input: {
  mode: DynamicCircleMode
  boundary: BoundaryType
  B: number
  v: number
  thetaDeg: number
  y0: number
  xBound: number
  triangleX: number
  triangleHeight: number
  circleCenter: TrajectoryPoint
  circleRadius: number
  elapsed: number
  sweep: boolean
}): DynamicCircleReadings {
  const trajectoryData = buildTrajectory(input)
  const radius = radiusFromField(input.v, input.B)
  const angularSpeed = Math.abs(input.B)
  const cyclotronPeriod = angularSpeed < EPSILON ? Infinity : 2 * Math.PI / angularSpeed
  const boundaryDistance = input.boundary === 'straight'
    ? Math.max(0, input.xBound - X0)
    : input.boundary === 'circle' ? input.circleRadius : input.triangleX - X0
  // For a particle injected tangentially at x = X0, the farthest x reaches
  // X0 + R.  Therefore the straight-boundary critical radius is the available
  // width itself (the same geometric comparison is used for the other bounds).
  const criticalRadius = Math.max(1, boundaryDistance)
  const hitBoundary = trajectoryData.trajectory.some((point) => !boundaryContains(point, input))
  const ratio = radius / criticalRadius
  const status: DynamicCircleReadings['status'] = hitBoundary ? 'escaped' : ratio > 0.92 ? 'critical' : 'safe'
  return {
    radius,
    cyclotronPeriod,
    angularSpeed,
    deflectionDeg: trajectoryData.deflectionDeg,
    criticalRadius,
    boundaryDistance,
    hitBoundary,
    status,
    center: trajectoryData.center,
    particle: trajectoryData.particle,
    trajectory: trajectoryData.trajectory,
  }
}

export function buildRadiusTrace(field = 0.1, speed = 12, samples = 9): Array<[number, number]> {
  const count = Math.max(2, Math.floor(samples))
  return Array.from({ length: count }, (_, index) => {
    const v = speed * (0.5 + index / (count - 1))
    return [v, radiusFromField(v, field)]
  })
}
