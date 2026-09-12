export type VolumePreset = 'small' | 'medium' | 'large'

export type IdealGasParams = {
  temperatureK: number
  volumeL: number
  volumePreset: VolumePreset
}

export type IdealGasReadings = {
  pressureAtm: number
  celsius: number
  slopeAtmPerK: number
  molecularSpeed: number
  densityRelative: number
  absoluteZeroC: number
  lockedVolume: boolean
}

const REFERENCE_TEMPERATURE = 220
const REFERENCE_PRESSURE = 0.7
const REFERENCE_VOLUME = 6
const ABSOLUTE_ZERO_C = -273.15
const EPSILON = 0.0001

export const VOLUME_PRESETS: Record<VolumePreset, { volumeL: number; label: string }> = {
  small: { volumeL: 2, label: 'V₁ = 2.0 L（小）' },
  medium: { volumeL: 3, label: 'V₂ = 3.0 L（中）' },
  large: { volumeL: 6, label: 'V₃ = 6.0 L（大）' },
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function deriveIdealGasReadings(params: IdealGasParams): IdealGasReadings {
  const volumeL = Math.max(EPSILON, params.volumeL)
  const slopeAtmPerK = REFERENCE_PRESSURE / REFERENCE_TEMPERATURE * REFERENCE_VOLUME / volumeL
  const temperatureK = Math.max(0, params.temperatureK)
  return {
    pressureAtm: slopeAtmPerK * temperatureK,
    celsius: temperatureK + ABSOLUTE_ZERO_C,
    slopeAtmPerK,
    molecularSpeed: Math.sqrt(temperatureK / REFERENCE_TEMPERATURE),
    densityRelative: REFERENCE_VOLUME / volumeL,
    absoluteZeroC: ABSOLUTE_ZERO_C,
    lockedVolume: true,
  }
}

export type IsochoricAxis = 'kelvin' | 'celsius'

export function buildIsochoricTrace(volumeL: number, axis: IsochoricAxis, samples = 81): Array<[number, number]> {
  const count = Math.max(2, Math.floor(samples))
  const min = axis === 'kelvin' ? 0 : -340
  const max = axis === 'kelvin' ? 420 : 200
  return Array.from({ length: count }, (_, index) => {
    const x = min + (max - min) * index / (count - 1)
    const temperatureK = axis === 'kelvin' ? x : x - ABSOLUTE_ZERO_C
    const pressure = deriveIdealGasReadings({ temperatureK, volumeL, volumePreset: 'large' }).pressureAtm
    return [x, pressure]
  })
}

export function volumeLabel(volumeL: number): string {
  const preset = Object.values(VOLUME_PRESETS).find((item) => Math.abs(item.volumeL - volumeL) < 0.01)
  return preset?.label ?? `V = ${volumeL.toFixed(1)} L`
}

export const IDEAL_GAS_CONSTANTS = Object.freeze({
  referenceTemperature: REFERENCE_TEMPERATURE,
  referencePressure: REFERENCE_PRESSURE,
  referenceVolume: REFERENCE_VOLUME,
  absoluteZeroC: ABSOLUTE_ZERO_C,
})
