import { describe, expect, it } from 'vitest'
import { hookAcceleration } from './model'
import { CART_CAMERA, cartPose, cartView } from './pose'

const base = { hooks: 3, v0: 0.1, dh: 0, group: 5, stage: 'run' as const, assembly: 0 }

describe('cart pose', () => {
  it('parks the cart, wheels and striker at the source origin', () => {
    const pose = cartPose({ ...base, time: 0 })
    expect(pose.cartX).toBe(-2.8)
    expect(pose.wheelRotation).toBeCloseTo(0, 12)
    expect(pose.strikerY).toBeCloseTo(0.43, 12)
    expect(pose.tapeLength).toBeCloseTo(0.6, 12)
    expect(pose.dots).toHaveLength(1)
    expect(pose.discCount).toBe(3)
    expect(pose.pulleyY).toBeCloseTo(0.33, 12)
    expect(pose.guideVisible).toBe(false)
    expect(pose.arrowVisible).toBe(false)
  })

  it('lifts the striker at a quarter cycle and rolls the wheels with the tape', () => {
    expect(cartPose({ ...base, time: 0.005 }).strikerY).toBeCloseTo(0.45, 12)
    const moved = cartPose({ ...base, time: 1 })
    const travel = moved.x * 4.4
    expect(moved.x).toBeCloseTo(0.37735849056603776, 10)
    expect(moved.v).toBeCloseTo(0.6547169811320754, 10)
    expect(moved.cartX).toBeCloseTo(-2.8 + travel, 10)
    expect(moved.wheelRotation).toBeCloseTo(-travel / 0.15, 10)
    expect(moved.pulleyRotation).toBeCloseTo(-travel / 0.11, 10)
    expect(moved.arrowLength).toBeCloseTo(0.3 + moved.v * 1.5, 12)
    expect(moved.arrowVisible).toBe(true)
    expect(cartPose({ ...base, time: 0.04 }).dots).toHaveLength(3)
    expect(cartPose({ ...base, time: 1.6 }).dots).toHaveLength(81)
  })

  it('reveals parts in assembly order and hides the pulley without hooks', () => {
    const empty = cartPose({ ...base, time: 0, stage: 'assemble', assembly: 0 })
    expect(empty.cartVisible).toBe(false)
    expect(empty.timerVisible).toBe(false)
    expect(empty.tapeVisible).toBe(false)
    const cartOnly = cartPose({ ...base, time: 0, stage: 'assemble', assembly: 1 })
    expect(cartOnly.cartVisible).toBe(true)
    expect(cartOnly.timerVisible).toBe(false)
    expect(cartPose({ ...base, time: 0, hooks: 0 }).pulleyVisible).toBe(false)
    expect(cartPose({ ...base, time: 0, dh: 0.0025 }).guideVisible).toBe(true)
    expect(hookAcceleration(0)).toBe(0)
  })

  it('frames the bench with the reference camera', () => {
    expect(CART_CAMERA.fov).toBe(35)
    expect(CART_CAMERA.minDistance).toBe(6)
    expect(CART_CAMERA.maxDistance).toBe(23)
    expect(cartView('home').target).toEqual([0, 0.1, 0])
    expect(cartView('home')).toMatchObject({ azimuth: 0.28, elevation: 0.62, radius: 11.7 })
    expect(cartView('focus').target).toEqual([-2.2, 0.8, 0])
  })
})
