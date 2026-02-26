export function buildBeamPathPoints(beamX: number, beamY: number): [number, number, number][] {
  const x = Math.max(-1, Math.min(1, beamX))
  const y = Math.max(-1, Math.min(1, beamY))
  const points: [number, number, number][] = []

  const p0: [number, number, number] = [-3.35, 0, 0]
  const p1: [number, number, number] = [-1.6, y * 0.08, x * 0.04]
  const p2: [number, number, number] = [1.2, y * 0.48, x * 0.34]
  const p3: [number, number, number] = [3.15, y * 0.75, x * 0.75]

  const samples = 32
  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples
    const mt = 1 - t

    const bx =
      mt * mt * mt * p0[0] + 3 * mt * mt * t * p1[0] + 3 * mt * t * t * p2[0] + t * t * t * p3[0]
    const by =
      mt * mt * mt * p0[1] + 3 * mt * mt * t * p1[1] + 3 * mt * t * t * p2[1] + t * t * t * p3[1]
    const bz =
      mt * mt * mt * p0[2] + 3 * mt * mt * t * p1[2] + 3 * mt * t * t * p2[2] + t * t * t * p3[2]

    points.push([bx, by, bz])
  }

  return points
}

function toUnitPhase(phase: number): number {
  if (!Number.isFinite(phase)) {
    return 0
  }
  const wrapped = phase % 1
  return wrapped < 0 ? wrapped + 1 : wrapped
}

export function deriveBeamPhase(timeCursor: number, running: boolean): number {
  if (!running) {
    return 1
  }

  const beamPulseHz = 6
  return toUnitPhase(timeCursor * beamPulseHz)
}

function clampPathPhase(phase: number): number {
  if (!Number.isFinite(phase)) {
    return 0
  }
  return Math.max(0, Math.min(1, phase))
}

export function buildBeamFlightTrailPoints(
  beamPath: [number, number, number][],
  phase: number,
  trailSamples = 12,
): [number, number, number][] {
  if (beamPath.length === 0) {
    return []
  }

  const normalizedPhase = clampPathPhase(phase)
  const headIndex = Math.max(
    0,
    Math.min(beamPath.length - 1, Math.round(normalizedPhase * (beamPath.length - 1))),
  )
  const trailSize = Math.max(2, Math.min(trailSamples, beamPath.length))
  const start = Math.max(0, headIndex - (trailSize - 1))
  const segment = beamPath.slice(start, headIndex + 1)

  if (segment.length >= 2) {
    return segment
  }

  return beamPath.slice(Math.max(0, headIndex - 1), headIndex + 1)
}
