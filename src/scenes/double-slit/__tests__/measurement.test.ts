import { describe, expect, it } from 'vitest'
import {
  clampMicrometerReadout,
  computeWavelengthMeasurement,
  DEFAULT_FRINGE_COUNT,
  INITIAL_MEASUREMENT_READOUT_MM,
  MICROMETER_DIVISION_MM,
  MICROMETER_PITCH_MM,
  micrometerWheelRotationRadians,
} from '../measurement'

describe('double-slit measurement workflow', () => {
  it('uses the reference micrometer pitch and one-division readout', () => {
    expect(MICROMETER_PITCH_MM).toBe(0.5)
    expect(MICROMETER_DIVISION_MM).toBe(0.01)
    expect(DEFAULT_FRINGE_COUNT).toBe(7)
    expect(INITIAL_MEASUREMENT_READOUT_MM).toBe(5.504)
  })

  it('clamps and rounds the micrometer readout to 0.001 mm', () => {
    expect(clampMicrometerReadout(-1)).toBe(0)
    expect(clampMicrometerReadout(26)).toBe(25)
    expect(clampMicrometerReadout(5.50449)).toBe(5.504)
    expect(clampMicrometerReadout(Number.NaN)).toBe(INITIAL_MEASUREMENT_READOUT_MM)
  })

  it('rotates the handwheel one full turn per 0.5 mm of travel', () => {
    expect(micrometerWheelRotationRadians(0)).toBe(0)
    expect(micrometerWheelRotationRadians(0.5)).toBeCloseTo(0, 10)
    expect(micrometerWheelRotationRadians(0.25)).toBeCloseTo(Math.PI, 10)
  })

  it('derives 532 nm from seven fringes separated by 1.49 mm at d=0.25 mm and L=0.7 m', () => {
    const spacingMm = 0.7 * 532e-9 / (0.25e-3) * 1000
    const result = computeWavelengthMeasurement({
      slitDistanceMm: 0.25,
      screenDistanceM: 0.7,
      firstReadingMm: 5.504,
      secondReadingMm: 5.504 + spacingMm * 6,
      fringeCount: 7,
    })

    expect(result?.fringeSpacingMm).toBeCloseTo(spacingMm, 10)
    expect(result?.wavelengthNm).toBeCloseTo(532, 8)
  })

  it('accepts measurements made in either direction and rejects invalid records', () => {
    const input = {
      slitDistanceMm: 0.2,
      screenDistanceM: 1,
      firstReadingMm: 9,
      secondReadingMm: 3,
      fringeCount: 4,
    }
    expect(computeWavelengthMeasurement(input)?.fringeSpacingMm).toBe(2)
    expect(computeWavelengthMeasurement({ ...input, fringeCount: 1 })).toBeNull()
    expect(computeWavelengthMeasurement({ ...input, secondReadingMm: 9 })).toBeNull()
    expect(computeWavelengthMeasurement({ ...input, slitDistanceMm: 0 })).toBeNull()
  })
})
