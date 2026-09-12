import { describe, expect, it } from 'vitest'
import { buildCyclotronTrail, buildEnergyTrace, calculateEnergy, calculateMaxEnergy, calculateRadius, deriveCyclotronReadings } from './model'

describe('cyclotron-core model', () => {
  it('supports the downloaded scene particle choices and mass/charge relations', () => {
    expect(calculateMaxEnergy('proton', 3)).toBeCloseTo(360)
    expect(calculateMaxEnergy('deuteron', 3)).toBeCloseTo(180)
    expect(calculateMaxEnergy('alpha', 3)).toBeCloseTo(360)
  })

  it('increments kinetic energy by qU and caps at the device maximum', () => {
    expect(calculateEnergy('proton', 3, 30, 2)).toBeCloseTo(60)
    expect(calculateEnergy('proton', 3, 30, 99)).toBeCloseTo(calculateMaxEnergy('proton', 3))
    expect(calculateMaxEnergy('proton', 3)).toBe(calculateMaxEnergy('proton', 3))
  })

  it('keeps the cyclotron period independent of speed and reports alternating polarity', () => {
    const readings = deriveCyclotronReadings({ type: 'proton', B: 3, U: 30, elapsed: 4.1, running: true })
    expect(readings.periodRatio).toBeCloseTo(1 / 3)
    expect(readings.angularFrequency).toBeCloseTo(3)
    expect(readings.polarityTop).not.toBe(readings.polarityBottom)
    expect(readings.radius).toBeGreaterThan(calculateRadius('proton', 3, 0))
  })

  it('builds alternating semicircles and an extraction segment', () => {
    const trail = buildCyclotronTrail({ type: 'proton', B: 3, U: 30, accelerationCount: 3, phase: 0.4 })
    expect(trail.trail.length).toBeGreaterThan(70)
    expect(Number.isFinite(trail.particlePosition[0])).toBe(true)
    const extracted = buildCyclotronTrail({ type: 'proton', B: 3, U: 30, accelerationCount: 12, phase: 0.2 })
    expect(extracted.extracted).toBe(true)
    expect(extracted.radius).toBe(230)
  })

  it('creates a monotonic energy chart trace', () => {
    const trace = buildEnergyTrace('proton', 3, 30, 9)
    expect(trace).toHaveLength(9)
    expect(trace[0][1]).toBe(0)
    expect(trace[1][1]).toBeLessThan(trace.at(-1)?.[1] ?? 0)
  })
})
