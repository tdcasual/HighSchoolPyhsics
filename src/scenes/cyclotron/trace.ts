export type CyclotronEnergyMode = 'ignore-acceleration-time' | 'include-acceleration-time'

export type TimeSample = {
  timeS: number
  value: number
}

type EvaluateEnergyOptions = {
  mode: CyclotronEnergyMode
  timeS: number
  periodS: number
  initialEnergyJ: number
  deltaEnergyJ: number
  crossingDurationS: number
}

type BuildTimeSeriesOptions = {
  endTimeS: number
  windowS: number
  samples: number
  evaluate: (timeS: number) => number
}

function safePositive(value: number, fallback: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return fallback
  }
  return value
}

export function deriveAdaptiveWindowS(periodS: number): number {
  return safePositive(periodS, 1) * 4
}

export function evaluateGapVoltageAtTime(timeS: number, amplitudeV: number, periodS: number): number {
  const period = safePositive(periodS, 1)
  const normalized = ((timeS % period) + period) / period % 1
  return normalized < 0.5 ? amplitudeV : -amplitudeV
}

export function evaluateKineticEnergyAtTime(options: EvaluateEnergyOptions): number {
  const periodS = safePositive(options.periodS, 1)
  const deltaEnergyJ = Math.max(0, options.deltaEnergyJ)
  const halfPeriodS = periodS / 2
  const normalizedTimeS = Math.max(0, options.timeS)

  const crossingIndex = Math.floor(normalizedTimeS / halfPeriodS)
  const halfPeriodPhaseS = normalizedTimeS - crossingIndex * halfPeriodS
  const baseEnergy = options.initialEnergyJ + crossingIndex * deltaEnergyJ

  if (options.mode === 'ignore-acceleration-time') {
    return baseEnergy + (halfPeriodPhaseS > 0 ? deltaEnergyJ : 0)
  }

  const maxCrossingDurationS = halfPeriodS * 0.8
  const crossingDurationS = Math.min(
    maxCrossingDurationS,
    safePositive(options.crossingDurationS, 0),
  )

  if (crossingDurationS === 0) {
    return baseEnergy + deltaEnergyJ
  }

  const progress = Math.min(1, halfPeriodPhaseS / crossingDurationS)
  return baseEnergy + deltaEnergyJ * progress
}

export function buildTimeSeries(options: BuildTimeSeriesOptions): TimeSample[] {
  const samples = Math.max(2, Math.floor(safePositive(options.samples, 240)))
  const windowS = safePositive(options.windowS, 1)
  const endTimeS = Math.max(0, options.endTimeS)
  const startTimeS = Math.max(0, endTimeS - windowS)

  const result: TimeSample[] = []
  for (let index = 0; index < samples; index += 1) {
    const ratio = index / (samples - 1)
    const timeS = startTimeS + (endTimeS - startTimeS) * ratio
    result.push({
      timeS,
      value: options.evaluate(timeS),
    })
  }

  return result
}
