
export function deriveVerticalDeflection(signalV: number, fullScaleV: number): number {
  if (!Number.isFinite(signalV) || !Number.isFinite(fullScaleV) || fullScaleV <= 0) {
    return 0
  }

  return Math.max(-1, Math.min(1, signalV / fullScaleV))
}

export function deriveDeflectionFromVoltage(signalV: number, fullScaleV: number): number {
  return deriveVerticalDeflection(signalV, fullScaleV)
}
