import { describe, expect, it } from 'vitest'
import {
  buildCyclotronTrail,
  buildEnergyTrace,
  calculateEnergy,
  calculateMaxEnergy,
  calculateRadius,
  deriveCyclotronReadings,
  MAX_CROSSINGS,
  MAX_ENERGY_COEFFICIENT_KEV,
  REFERENCE_DEVICE_RADIUS_M,
} from './model'

describe('cyclotron-core model', () => {
  it('derives the teaching energy scale from a fixed effective device radius', () => {
    expect(REFERENCE_DEVICE_RADIUS_M).toBeCloseTo(0.0288, 4)
    expect(MAX_ENERGY_COEFFICIENT_KEV).toBe(40)
    expect(calculateMaxEnergy('proton', 3)).toBeCloseTo(360)
    expect(calculateMaxEnergy('deuteron', 3)).toBeCloseTo(180)
    expect(calculateMaxEnergy('alpha', 3)).toBeCloseTo(360)
  })

  it('adds qU per crossing and caps the energy at the device maximum', () => {
    expect(calculateEnergy('proton', 3, 30, 2)).toBeCloseTo(60)
    expect(calculateEnergy('proton', 3, 30, 99)).toBeCloseTo(calculateMaxEnergy('proton', 3))
    expect(calculateEnergy('alpha', 3, 10, 1)).toBeCloseTo(20)
  })

  it('starts at zero radius and follows r proportional to sqrt(E)', () => {
    expect(calculateRadius('proton', 3, 0)).toBe(0)
    expect(calculateRadius('proton', 3, 90)).toBeCloseTo(115)
    expect(calculateRadius('proton', 3, 500)).toBe(230)
  })

  it('keeps period ratios and relative orbit timing tied to qB/m', () => {
    const proton = deriveCyclotronReadings({ type: 'proton', B: 3, U: 30, elapsed: 0.6, running: true })
    const deuteron = deriveCyclotronReadings({ type: 'deuteron', B: 3, U: 30, elapsed: 0.6, running: true })
    expect(proton.periodRatio).toBeCloseTo(1)
    expect(deuteron.periodRatio).toBeCloseTo(2)
    expect(proton.angularFrequency).toBeCloseTo(3)
    expect(deuteron.angularFrequency).toBeCloseTo(1.5)
    expect(proton.progress).toBeGreaterThan(0.5)
    expect(deuteron.progress).toBeLessThan(0.5)
  })

  it('reverses the dee polarity halfway through each semicircle', () => {
    const beforeReversal = deriveCyclotronReadings({ type: 'proton', B: 3, U: 30, elapsed: 0.5, running: true })
    const afterReversal = deriveCyclotronReadings({ type: 'proton', B: 3, U: 30, elapsed: 0.6, running: true })
    expect(beforeReversal.polarityTop).toBe('-')
    expect(beforeReversal.polarityBottom).toBe('+')
    expect(afterReversal.polarityTop).toBe('+')
    expect(afterReversal.polarityBottom).toBe('-')
  })

  it('joins semicircles smoothly from the ion source and keeps the scaled track inside the Dee', () => {
    const trail = buildCyclotronTrail({ type: 'proton', B: 3, U: 30, accelerationCount: 3, phase: 0.4 })
    expect(trail.trail[0]).toEqual([0, 0])
    expect(trail.trail[1][1]).toBeGreaterThan(0)
    expect(Number.isFinite(trail.particlePosition[0])).toBe(true)
    expect(Math.max(...trail.trail.map(([x, y]) => Math.hypot(x, y)))).toBeLessThan(4.55)
    const longestOrbitStep = Math.max(...trail.trail.slice(1).map(([x, y], index) => {
      const previous = trail.trail[index]
      return Math.hypot(x - previous[0], y - previous[1])
    }))
    expect(longestOrbitStep).toBeLessThan(1)
  })

  it('keeps the extracted particle on one tangent beam beyond the Dee edge', () => {
    const extracted = buildCyclotronTrail({ type: 'proton', B: 3, U: 30, accelerationCount: 12, phase: 0.2 })
    expect(extracted.extracted).toBe(true)
    expect(extracted.radius).toBe(230)
    const exitPoint = extracted.trail.at(-2)!
    expect(Math.hypot(...exitPoint)).toBeLessThan(4.55)
    expect(extracted.particlePosition[0]).toBeCloseTo(exitPoint[0])
    expect(Math.abs(extracted.particlePosition[1] - exitPoint[1])).toBeCloseTo(1.8)
    expect(extracted.trail.at(-1)).toEqual(extracted.particlePosition)
  })

  it('reports extraction once the required number of gap crossings is complete', () => {
    const readings = deriveCyclotronReadings({ type: 'proton', B: 3, U: 30, elapsed: 20, running: true })
    expect(readings.extracted).toBe(true)
    expect(readings.energy).toBeCloseTo(readings.maxEnergy)
  })

  it('builds a monotonic energy trace at every integer crossing', () => {
    const trace = buildEnergyTrace('proton', 3, 30)
    expect(trace).toHaveLength(MAX_CROSSINGS + 1)
    expect(trace[0]).toEqual([0, 0])
    expect(trace[12][0]).toBe(12)
    expect(trace[12][1]).toBeCloseTo(360)
    expect(trace.at(-1)?.[1]).toBeCloseTo(360)
  })
})

describe('elapsedAtNextCrossing', () => {
  it('advances exactly one gap crossing per step', async () => {
    const { deriveCyclotronReadings, elapsedAtNextCrossing } = await import('./model')
    let elapsed = 0
    for (let n = 1; n <= 3; n++) {
      elapsed = elapsedAtNextCrossing({ type: 'proton', B: 3, elapsed })
      const readings = deriveCyclotronReadings({ type: 'proton', B: 3, U: 30, elapsed, running: false })
      expect(readings.accelerationCount).toBe(n)
    }
  })
})
