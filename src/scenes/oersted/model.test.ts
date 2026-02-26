import { describe, expect, it } from 'vitest'
import { deriveOerstedNeedleState, stepNeedleHeading } from './model'

describe('oersted model', () => {
  it('increases deflection magnitude when needle is closer to the wire', () => {
    const far = deriveOerstedNeedleState({
      currentA: 6,
      needlePositionM: { x: 0.16, z: 0 },
      initialHeadingDeg: 0,
    })
    const near = deriveOerstedNeedleState({
      currentA: 6,
      needlePositionM: { x: 0.07, z: 0 },
      initialHeadingDeg: 0,
    })

    expect(Math.abs(near.deflectionDeg)).toBeGreaterThan(Math.abs(far.deflectionDeg))
    expect(near.wireFieldMicroT).toBeGreaterThan(far.wireFieldMicroT)
  })

  it('reverses deflection direction when current direction is reversed', () => {
    const forwardCurrent = deriveOerstedNeedleState({
      currentA: 6,
      needlePositionM: { x: 0.08, z: 0.08 },
      initialHeadingDeg: 0,
    })
    const reverseCurrent = deriveOerstedNeedleState({
      currentA: -6,
      needlePositionM: { x: 0.08, z: 0.08 },
      initialHeadingDeg: 0,
    })

    expect(Math.sign(forwardCurrent.deflectionDeg)).toBe(-Math.sign(reverseCurrent.deflectionDeg))
  })

  it('reduces observed swing when initial needle direction is already close to target', () => {
    const baseline = deriveOerstedNeedleState({
      currentA: 5,
      needlePositionM: { x: 0.1, z: 0 },
      initialHeadingDeg: 0,
    })
    const preAligned = deriveOerstedNeedleState({
      currentA: 5,
      needlePositionM: { x: 0.1, z: 0 },
      initialHeadingDeg: baseline.targetHeadingDeg,
    })

    expect(Math.abs(preAligned.observedSwingDeg)).toBeLessThan(Math.abs(baseline.observedSwingDeg))
    expect(preAligned.discoveryLevel).toBe('low')
  })

  it('moves current heading toward target heading smoothly', () => {
    const next = stepNeedleHeading(0, 90, 0.1, 5)

    expect(next).toBeGreaterThan(0)
    expect(next).toBeLessThan(90)
  })

  it('follows right-hand rule for northward current direction around wire', () => {
    const state = deriveOerstedNeedleState({
      currentA: 6,
      needlePositionM: { x: 0.1, z: 0 },
      initialHeadingDeg: 0,
    })

    expect(state.wireFieldVectorMicroT.x).toBeGreaterThan(0)
    expect(Math.abs(state.wireFieldVectorMicroT.z)).toBeLessThan(1e-9)
  })
})
