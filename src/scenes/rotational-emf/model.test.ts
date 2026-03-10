import { describe, expect, it } from 'vitest'
import {
  deriveRotatingFrameEmfMagnitude,
  deriveRotatingRodEmfMagnitude,
  deriveRotationalEmfReadout,
} from './model'

describe('rotational-emf model', () => {
  it('keeps the rotating rod magnitude independent of angle in the standard classroom model', () => {
    const atZero = deriveRotatingRodEmfMagnitude({
      magneticFieldT: 1,
      angularSpeed: 1,
      effectiveLengthM: 1,
      angleRad: 0,
    })
    const atQuarterTurn = deriveRotatingRodEmfMagnitude({
      magneticFieldT: 1,
      angularSpeed: 1,
      effectiveLengthM: 1,
      angleRad: Math.PI / 2,
    })

    expect(atZero).toBeCloseTo(0.5)
    expect(atQuarterTurn).toBeCloseTo(atZero)
  })

  it('makes the rotating frame magnitude vary with angle and vanish at the aligned state', () => {
    const atZero = deriveRotatingFrameEmfMagnitude({
      magneticFieldT: 1,
      angularSpeed: 1,
      effectiveLengthM: 1,
      angleRad: 0,
    })
    const atQuarterTurn = deriveRotatingFrameEmfMagnitude({
      magneticFieldT: 1,
      angularSpeed: 1,
      effectiveLengthM: 1,
      angleRad: Math.PI / 2,
    })

    expect(atZero).toBeCloseTo(0)
    expect(atQuarterTurn).toBeGreaterThan(atZero)
    expect(atQuarterTurn).toBeCloseTo(1)
  })

  it('scales both scenarios with B, ω, and effective length', () => {
    const rodBase = deriveRotatingRodEmfMagnitude({
      magneticFieldT: 1,
      angularSpeed: 1,
      effectiveLengthM: 1,
      angleRad: 0,
    })
    const rodScaled = deriveRotatingRodEmfMagnitude({
      magneticFieldT: 2,
      angularSpeed: 2,
      effectiveLengthM: 2,
      angleRad: 0,
    })

    expect(rodScaled).toBeGreaterThan(rodBase)

    const frameBase = deriveRotatingFrameEmfMagnitude({
      magneticFieldT: 1,
      angularSpeed: 1,
      effectiveLengthM: 1,
      angleRad: Math.PI / 2,
    })
    const frameScaled = deriveRotatingFrameEmfMagnitude({
      magneticFieldT: 2,
      angularSpeed: 2,
      effectiveLengthM: 2,
      angleRad: Math.PI / 2,
    })

    expect(frameScaled).toBeGreaterThan(frameBase)
  })

  it('produces different readouts for the two scenarios at the same defaults', () => {
    const rod = deriveRotationalEmfReadout({
      scenario: 'rod',
      magneticFieldT: 1,
      angularSpeed: 1,
      effectiveLengthM: 1,
      angleRad: 0,
    })
    const frame = deriveRotationalEmfReadout({
      scenario: 'frame',
      magneticFieldT: 1,
      angularSpeed: 1,
      effectiveLengthM: 1,
      angleRad: 0,
    })

    expect(rod.emfMagnitudeV).toBeGreaterThan(frame.emfMagnitudeV)
  })
})
