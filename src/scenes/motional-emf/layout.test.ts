import { describe, expect, it } from 'vitest'
import { MOTIONAL_EMF_LAYOUT } from './layout'

describe('motional-emf layout', () => {
  it('keeps the rod endpoints defined without platform or rails', () => {
    expect(MOTIONAL_EMF_LAYOUT.rod.restLeftContact[0]).toBeLessThan(0)
    expect(MOTIONAL_EMF_LAYOUT.rod.restRightContact[0]).toBeGreaterThan(0)
    expect(MOTIONAL_EMF_LAYOUT).not.toHaveProperty('base')
    expect(MOTIONAL_EMF_LAYOUT).not.toHaveProperty('rails')
  })

  it('starts meter wires from the rod contact points', () => {
    expect(MOTIONAL_EMF_LAYOUT.wires.aLeadStart).toEqual(MOTIONAL_EMF_LAYOUT.rod.restLeftContact)
    expect(MOTIONAL_EMF_LAYOUT.wires.bLeadStart).toEqual(MOTIONAL_EMF_LAYOUT.rod.restRightContact)
  })

  it('places the voltmeter behind the motion sweep area', () => {
    expect(MOTIONAL_EMF_LAYOUT.meter.center[2]).toBeLessThan(-MOTIONAL_EMF_LAYOUT.motion.travelDistance)
    expect(MOTIONAL_EMF_LAYOUT.meter.rotationY).toBeCloseTo(0)
  })

  it('keeps the voltmeter compact in the floating schematic layout', () => {
    expect(MOTIONAL_EMF_LAYOUT.meter.bodySize[0]).toBeLessThan(MOTIONAL_EMF_LAYOUT.field.size[0])
    expect(MOTIONAL_EMF_LAYOUT.meter.bodySize[2]).toBeLessThanOrEqual(1.1)
  })

  it('extends and slims magnetic field arrows for clearer classroom readability', () => {
    expect(MOTIONAL_EMF_LAYOUT.field.lineLengthY).toBeGreaterThan(3)
    expect(MOTIONAL_EMF_LAYOUT.field.lineRadius).toBeLessThan(0.03)
  })
})
