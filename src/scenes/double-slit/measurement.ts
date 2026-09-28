export const INITIAL_MEASUREMENT_READOUT_MM = 5.504
export const MICROMETER_MIN_READOUT_MM = 0
export const MICROMETER_MAX_READOUT_MM = 25
export const MICROMETER_PITCH_MM = 0.5
export const MICROMETER_DIVISIONS_PER_TURN = 50
export const MICROMETER_DIVISION_MM = MICROMETER_PITCH_MM / MICROMETER_DIVISIONS_PER_TURN
export const DEFAULT_FRINGE_COUNT = 7

export type WavelengthMeasurement = {
  fringeSpacingMm: number
  wavelengthNm: number
}

export function clampMicrometerReadout(valueMm: number): number {
  if (!Number.isFinite(valueMm)) return INITIAL_MEASUREMENT_READOUT_MM
  const clamped = Math.min(MICROMETER_MAX_READOUT_MM, Math.max(MICROMETER_MIN_READOUT_MM, valueMm))
  return Math.round(clamped * 1000) / 1000
}

export function micrometerWheelRotationRadians(readoutMm: number): number {
  const turns = readoutMm / MICROMETER_PITCH_MM
  return ((turns % 1) + 1) % 1 * Math.PI * 2
}

export function computeWavelengthMeasurement(input: {
  slitDistanceMm: number
  screenDistanceM: number
  firstReadingMm: number
  secondReadingMm: number
  fringeCount: number
}): WavelengthMeasurement | null {
  const values = [input.slitDistanceMm, input.screenDistanceM, input.firstReadingMm, input.secondReadingMm]
  if (!values.every(Number.isFinite)) return null
  if (input.slitDistanceMm <= 0 || input.screenDistanceM <= 0) return null
  if (!Number.isInteger(input.fringeCount) || input.fringeCount < 2) return null

  const fringeSpacingMm = Math.abs(input.secondReadingMm - input.firstReadingMm) / (input.fringeCount - 1)
  if (fringeSpacingMm <= 0) return null

  // d and Δx are converted from mm, L is in m; return the wavelength in nm.
  const wavelengthNm = input.slitDistanceMm * fringeSpacingMm / input.screenDistanceM * 1000
  if (!Number.isFinite(wavelengthNm) || wavelengthNm <= 0) return null
  return { fringeSpacingMm, wavelengthNm }
}
