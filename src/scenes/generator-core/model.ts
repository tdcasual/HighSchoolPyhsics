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
  const angleDeg = normalized * 180 / Math.PI
  const fluxNormalized = Math.cos(normalized)
  const emfNormalized = Math.sin(normalized)
  const nearNeutral = Math.abs(emfNormalized) < 0.08
  const nearParallel = Math.abs(fluxNormalized) < 0.08
  const position: GeneratorPosition = nearNeutral ? 'neutral' : nearParallel ? 'parallel' : 'transition'
  const positionLabel = position === 'neutral' ? '中性面' : position === 'parallel' ? '平行面' : '过渡位置'
  const cuttingLabel = nearNeutral
    ? 'v⊥ ≈ 0（不切割）'
    : `v⊥ = ${Math.abs(emfNormalized).toFixed(2)}v（切割增强）`
  const currentDirection = Math.abs(emfNormalized) < 0.08
    ? '换向瞬间'
    : emfNormalized > 0 ? '正向' : '反向'
  return {
    angleRad: normalized,
    angleDeg,
    fluxNormalized,
    emfNormalized,
    position,
    positionLabel,
    cuttingLabel,
    currentDirection,
    normalVector: [Math.cos(normalized), 0, Math.sin(normalized)],
    velocityVector: [Math.sin(normalized), 0, -Math.cos(normalized)],
  }
}

export function buildPhaseTrace(samples = 240): PhaseTrace {
  const count = Math.max(2, Math.floor(samples))
  const flux: Array<[number, number]> = []
  const emf: Array<[number, number]> = []
  for (let index = 0; index < count; index += 1) {
    const phase = index / (count - 1) * Math.PI * 2
    const x = index / (count - 1) * 2 - 1
    flux.push([x, Math.cos(phase)])
    emf.push([x, Math.sin(phase)])
  }
  return { flux, emf, tracker: [0, 1] }
}

export function phaseToPlotPoint(angleRad: number): [number, number] {
  const normalized = wrapAngle(angleRad)
  return [normalized / (Math.PI * 2) * 2 - 1, Math.cos(normalized)]
}

export function emfToPlotPoint(angleRad: number): [number, number] {
  const normalized = wrapAngle(angleRad)
  return [normalized / (Math.PI * 2) * 2 - 1, Math.sin(normalized)]
}

export function positionDescription(readings: GeneratorReadings): string {
  if (readings.position === 'neutral') {
    return '线圈平面与磁场垂直，法向量 n ∥ B。磁通量达到最大值，但变化率为零，感应电动势为零，电流方向在此处改变。'
  }
  if (readings.position === 'parallel') {
    return '线圈平面与磁场平行，磁通量为零，线圈切割磁感线的有效速度最大，感应电动势达到峰值。'
  }
  return '线圈转到过渡位置，磁通量按 cosθ 变化，感应电动势按 sinθ 变化；速度的垂直分量决定切割强弱。'
}

