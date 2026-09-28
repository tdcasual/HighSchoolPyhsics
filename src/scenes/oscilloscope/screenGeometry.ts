export type DisplayTracePoint = [horizontal: number, vertical: number]
export type CrtScreenPoint = [axisDepth: number, vertical: number, horizontal: number]

const CRT_SCREEN_FRONT_X = 3.162
const TRACE_RADIUS = 0.75
const GRID_RADIUS = 0.9

function clampUnit(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(-1, Math.min(1, value))
}

export function clampUnitDeflection(horizontal: number, vertical: number): DisplayTracePoint {
  let safeHorizontal = clampUnit(horizontal)
  let safeVertical = clampUnit(vertical)
  const radius = Math.hypot(safeHorizontal, safeVertical)

  if (radius > 1) {
    safeHorizontal /= radius
    safeVertical /= radius
  }

  return [safeHorizontal, safeVertical]
}

export function mapDisplayPointToCrtScreen(point: DisplayTracePoint): CrtScreenPoint {
  const [horizontal, vertical] = clampUnitDeflection(point[0], point[1])
  return [CRT_SCREEN_FRONT_X, vertical * TRACE_RADIUS, horizontal * TRACE_RADIUS]
}

export function buildCrtScreenGridSegments(): CrtScreenPoint[][] {
  const segments: CrtScreenPoint[][] = []
  const divisionsX = 10
  const divisionsY = 8

  for (let index = 1; index < divisionsX; index += 1) {
    const horizontal = ((index / divisionsX) * 2 - 1) * GRID_RADIUS
    const halfHeight = Math.sqrt(Math.max(0, GRID_RADIUS ** 2 - horizontal ** 2))
    segments.push([
      [CRT_SCREEN_FRONT_X, -halfHeight, horizontal],
      [CRT_SCREEN_FRONT_X, halfHeight, horizontal],
    ])
  }

  for (let index = 1; index < divisionsY; index += 1) {
    const vertical = ((index / divisionsY) * 2 - 1) * GRID_RADIUS
    const halfWidth = Math.sqrt(Math.max(0, GRID_RADIUS ** 2 - vertical ** 2))
    segments.push([
      [CRT_SCREEN_FRONT_X, vertical, -halfWidth],
      [CRT_SCREEN_FRONT_X, vertical, halfWidth],
    ])
  }

  return segments
}
