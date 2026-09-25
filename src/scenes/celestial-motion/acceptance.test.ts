import { describe, expect, it } from 'vitest'
import { scenarioOf } from './model'
import {
  applyPreset,
  createCelestialState,
  integrateCelestial,
  stepCelestial,
  toggleCelestial,
} from './state'

describe('celestial acceptance', () => {
  it('steps a visible arc and stops a Hohmann transfer at apoapsis', () => {
    const stepped = stepCelestial(createCelestialState())
    expect(stepped.time).toBeGreaterThan(0)
    expect(stepped.running).toBe(false)
    const transfer = applyPreset(createCelestialState(), 'transfer')
    const duration = scenarioOf(transfer).transT
    const finished = integrateCelestial({ ...transfer, running: true }, duration + 20)
    expect(finished.time).toBeCloseTo(duration, 6)
    expect(finished.running).toBe(false)
    expect(finished.finished).toBe(true)
    expect(toggleCelestial(finished)).toMatchObject({ time: 0, running: true, finished: false })
  })

  it('makes the geostationary preset equatorial and synchronous', () => {
    const geo = applyPreset(createCelestialState(), 'geo')
    const scenario = scenarioOf(geo)
    expect(scenario.mode).toBe('synchronous')
    expect(scenario.inclination).toBe(0)
    expect(scenario.q1).toBeGreaterThan(6.6)
    expect(scenario.q1).toBeLessThan(6.64)
    const tilted = applyPreset(geo, 'sync')
    expect(tilted.inclinationDeg).toBe(30)
    expect(scenarioOf(tilted).body.name).toBe('地球')
  })
})
