import type { ParticleState, Vector3Like } from '../../core/types'

export function computeOscilloscopeAcceleration(): Vector3Like {
  return { x: 0, y: 0, z: 0 }
}

export function deriveTimeCursor(state: ParticleState): number {
  return state.position.x
}

export function deriveSweepDeflection(timeS: number, sweepHz: number): number {
  if (!Number.isFinite(timeS) || !Number.isFinite(sweepHz) || sweepHz <= 0) {
    return -1
  }

  const phase = ((timeS * sweepHz) % 1 + 1) % 1
  return phase * 2 - 1
}

export function deriveVerticalDeflection(signalV: number, fullScaleV: number): number {
  if (!Number.isFinite(signalV) || !Number.isFinite(fullScaleV) || fullScaleV <= 0) {
    return 0
  }

  return Math.max(-1, Math.min(1, signalV / fullScaleV))
}

export function deriveDeflectionFromVoltage(signalV: number, fullScaleV: number): number {
  return deriveVerticalDeflection(signalV, fullScaleV)
}
