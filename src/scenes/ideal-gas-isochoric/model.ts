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
  gasAmountMol: number
  absoluteZeroC: number
  lockedVolume: boolean
}

const REFERENCE_TEMPERATURE = 220
const REFERENCE_PRESSURE_ATM = 0.7
const REFERENCE_VOLUME_L = 6
const GAS_CONSTANT = 8.314462618
const ATMOSPHERE_PA = 101325
const ABSOLUTE_ZERO_C = -273.15
const EPSILON = 0.0001
const REFERENCE_AMOUNT_MOL =
  (REFERENCE_PRESSURE_ATM * ATMOSPHERE_PA * (REFERENCE_VOLUME_L / 1000)) / (GAS_CONSTANT * REFERENCE_TEMPERATURE)

export const ISOCHORIC_TEMPERATURE_RANGE = Object.freeze({ minK: 100, maxK: 420 })
export const VOLUME_PRESETS: Record<VolumePreset, { volumeL: number; label: string }> = {
  small: { volumeL: 2, label: 'V₁ = 2.0 L（小）' },
  medium: { volumeL: 3, label: 'V₂ = 3.0 L（中）' },
  large: { volumeL: 6, label: 'V₃ = 6.0 L（大）' },
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Scene units for the gas column are linear in liters; the piston keeps cross-section fixed. */
export function chamberGasHeightForVolumeL(volumeL: number): number {
  return Math.max(EPSILON, volumeL * 0.56)
}

export function deriveIdealGasReadings(params: IdealGasParams): IdealGasReadings {
  const volumeL = Math.max(EPSILON, params.volumeL)
  const temperatureK = Math.max(0, params.temperatureK)
  const volumeM3 = volumeL / 1000
  const slopeAtmPerK = (REFERENCE_AMOUNT_MOL * GAS_CONSTANT) / volumeM3 / ATMOSPHERE_PA
  return {
    pressureAtm: slopeAtmPerK * temperatureK,
    celsius: temperatureK + ABSOLUTE_ZERO_C,
    slopeAtmPerK,
    molecularSpeed: Math.sqrt(temperatureK / REFERENCE_TEMPERATURE),
    densityRelative: REFERENCE_VOLUME_L / volumeL,
    gasAmountMol: REFERENCE_AMOUNT_MOL,
    absoluteZeroC: ABSOLUTE_ZERO_C,
    lockedVolume: true,
  }
}

export type IsochoricAxis = 'kelvin' | 'celsius'

export const IDEAL_GAS_CONSTANTS = Object.freeze({
  gasConstant: GAS_CONSTANT,
  atmospherePa: ATMOSPHERE_PA,
  amountMol: REFERENCE_AMOUNT_MOL,
  referenceTemperature: REFERENCE_TEMPERATURE,
  referencePressureAtm: REFERENCE_PRESSURE_ATM,
  referenceVolumeL: REFERENCE_VOLUME_L,
  absoluteZeroC: ABSOLUTE_ZERO_C,
})

export function buildIsochoricTraceSegment(
  volumeL: number,
  axis: IsochoricAxis,
  min: number,
  max: number,
  samples = 81,
): Array<[number, number]> {
  const count = Math.max(2, Math.floor(samples))
  return Array.from({ length: count }, (_, index) => {
    const x = min + ((max - min) * index) / (count - 1)
    const temperatureK = axis === 'kelvin' ? x : x - ABSOLUTE_ZERO_C
    const pressure = deriveIdealGasReadings({ temperatureK, volumeL, volumePreset: 'large' }).pressureAtm
    return [x, pressure]
  })
}
