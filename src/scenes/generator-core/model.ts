export type GeneratorMode = 'model' | 'phase'

export type GeneratorPosition = 'neutral' | 'parallel' | 'transition'

export type GeneratorReadings = {
  angleRad: number
  angleDeg: number
  fluxNormalized: number
  emfNormalized: number
  position: GeneratorPosition
  positionLabel: string
  cuttingLabel: string
  currentDirection: string
  normalVector: [number, number, number]
  velocityVector: [number, number, number]
}

export type PhaseTrace = {
  flux: Array<[number, number]>
  emf: Array<[number, number]>
  tracker: [number, number]
}

export function wrapAngle(angleRad: number): number {
  const period = Math.PI * 2
  return ((angleRad % period) + period) % period
}

export function deriveGeneratorReadings(angleRad: number): GeneratorReadings {
  const normalized = wrapAngle(angleRad)
  const angleDeg = (normalized * 180) / Math.PI
  const fluxNormalized = Math.cos(normalized)
  const emfNormalized = Math.sin(normalized)
  const nearNeutral = Math.abs(emfNormalized) < 0.08
  const nearParallel = Math.abs(fluxNormalized) < 0.08
  const position: GeneratorPosition = nearNeutral ? 'neutral' : nearParallel ? 'parallel' : 'transition'
  const positionLabel = position === 'neutral' ? '中性面' : position === 'parallel' ? '平行面' : '过渡位置'
  const cuttingLabel = nearNeutral ? 'v⊥ ≈ 0（不切割）' : `v⊥ = ${Math.abs(emfNormalized).toFixed(2)}v（切割增强）`
  const currentDirection = Math.abs(emfNormalized) < 0.08 ? '换向瞬间' : emfNormalized > 0 ? '正向' : '反向'
  return {
    angleRad: normalized,
    angleDeg,
    fluxNormalized,
    emfNormalized,
    position,
    positionLabel,
    cuttingLabel,
    currentDirection,
    normalVector: [Math.cos(normalized), 0, -Math.sin(normalized)],
    velocityVector: [Math.cos(normalized), 0, -Math.sin(normalized)],
  }
}

export function buildPhaseTrace(samples = 240): PhaseTrace {
  const count = Math.max(2, Math.floor(samples))
  const flux: Array<[number, number]> = []
  const emf: Array<[number, number]> = []
  for (let index = 0; index < count; index += 1) {
    const phase = (index / (count - 1)) * Math.PI * 2
    const x = (index / (count - 1)) * 2 - 1
    flux.push([x, Math.cos(phase)])
    emf.push([x, Math.sin(phase)])
  }
  return { flux, emf, tracker: [0, 1] }
}

export function phaseToPlotPoint(angleRad: number): [number, number] {
  const normalized = wrapAngle(angleRad)
  return [(normalized / (Math.PI * 2)) * 2 - 1, Math.cos(normalized)]
}

export function emfToPlotPoint(angleRad: number): [number, number] {
  const normalized = wrapAngle(angleRad)
  return [(normalized / (Math.PI * 2)) * 2 - 1, Math.sin(normalized)]
}

export function positionDescription(readings: GeneratorReadings): string {
  if (readings.position === 'neutral') {
    return '中性面：n ∥ B，|Φ| = Φₘ；dΦ/dt = 0，e = 0，电流在此换向。'
  }
  if (readings.position === 'parallel') {
    return '平行面：Φ = 0，导线垂直切割，|e| = Eₘ；电流方向随半周反转。'
  }
  return '过渡位置：Φ = Φₘ cosθ、e = Eₘ sinθ；v⊥/v = |sinθ|。'
}
