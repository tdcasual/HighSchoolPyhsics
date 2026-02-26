import { deriveDeflectionFromVoltage } from './runtime'

type EvaluateVoltage = (timeS: number) => number

type BuildDisplayTraceOptions = {
  timeCursor: number
  fullScaleV: number
  evaluateX: EvaluateVoltage
  evaluateY: EvaluateVoltage
  windowS?: number
  samples?: number
}

export const DEFAULT_TRACE_WINDOW_S = 2
export const DEFAULT_TRACE_SAMPLES = 960
const RETRACE_X_JUMP_THRESHOLD = 1.1

function normalizePositive(value: number, fallback: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return fallback
  }
  return value
}

export function buildDisplayTracePoints(options: BuildDisplayTraceOptions): Array<[number, number]> {
  const windowS = normalizePositive(options.windowS ?? DEFAULT_TRACE_WINDOW_S, DEFAULT_TRACE_WINDOW_S)
  const sampleCount = Math.max(2, Math.floor(normalizePositive(options.samples ?? DEFAULT_TRACE_SAMPLES, DEFAULT_TRACE_SAMPLES)))
  const start = options.timeCursor - windowS
  const points: Array<[number, number]> = []

  for (let index = 0; index < sampleCount; index += 1) {
    const ratio = index / (sampleCount - 1)
    const t = start + windowS * ratio
    const x = deriveDeflectionFromVoltage(options.evaluateX(t), options.fullScaleV)
    const y = deriveDeflectionFromVoltage(options.evaluateY(t), options.fullScaleV)
    points.push([x, y])
  }

  return points
}

export function buildDisplayTraceSegments(
  points: Array<[number, number]>,
  retraceXJumpThreshold = RETRACE_X_JUMP_THRESHOLD,
): Array<Array<[number, number]>> {
  if (points.length <= 1) {
    return points.length === 0 ? [] : [points]
  }

  const segments: Array<Array<[number, number]>> = []
  let active: Array<[number, number]> = [points[0]]

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1]
    const current = points[index]
    const dx = current[0] - previous[0]

    if (dx < -Math.abs(retraceXJumpThreshold)) {
      if (active.length >= 2) {
        segments.push(active)
      }
      active = [current]
      continue
    }

    active.push(current)
  }

  if (active.length >= 2) {
    segments.push(active)
  }

  return segments
}
