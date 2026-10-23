import { describe, expect, it } from 'vitest'
import { scenarioOf } from './model'
import { PRESETS, createCelestialState, minimumOuterOrbitRadius, setInnerOrbit, setMode, setOuterOrbit } from './state'

describe('celestial control state', () => {
  it('keeps preset inclinations on the slider step and aligned with DMIT examples', () => {
    expect([
      PRESETS.leo.inclinationDeg,
      PRESETS.sync.inclinationDeg,
      PRESETS.geo.inclinationDeg,
      PRESETS.meet.inclinationDeg,
      PRESETS.transfer.inclinationDeg,
    ]).toEqual([30, 30, 0, 20, 25])
    expect(Object.values(PRESETS).every((preset) => preset.inclinationDeg % 5 === 0)).toBe(true)
  })

  it('keeps the outer-orbit input, scenario, and displayed radius consistent at bounds', () => {
    const rendezvous = {
      ...createCelestialState(),
      mode: 'rendezvous' as const,
      r1: 1.4,
      r2: 2.2,
      time: 1800,
      running: true,
    }
    const raisedInner = setInnerOrbit(rendezvous, 2.45)
    expect(raisedInner.r2).toBe(minimumOuterOrbitRadius(2.45))
    expect(raisedInner.r2).toBe(2.6)
    expect(scenarioOf(raisedInner).q2).toBe(2.6)
    expect(raisedInner.time).toBe(0)
    expect(raisedInner.running).toBe(false)

    const reducedOuter = setOuterOrbit(raisedInner, 2.2)
    expect(reducedOuter.r2).toBe(2.6)
    expect(scenarioOf(reducedOuter).q2).toBe(reducedOuter.r2)

    const transitioned = setMode({ ...rendezvous, mode: 'circular', r1: 7.95, r2: 3 }, 'transfer')
    expect(transitioned.r2).toBe(8.1)
    expect(scenarioOf(transitioned).q2).toBe(8.1)
  })
})
