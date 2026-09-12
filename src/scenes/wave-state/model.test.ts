import { describe, expect, it } from 'vitest'
import { buildParticleStates, buildProbeTrace, buildWavePoints, deriveWaveReadings, waveAcceleration, waveDisplacement, waveVelocity } from './model'

const params = { amplitude: 10, wavelength: 4, period: 2, direction: 'right' as const }

describe('wave-state model', () => {
  it('follows y=A sin[2π(t/T−x/λ)] for rightward propagation', () => {
    expect(waveDisplacement(0, 0, params)).toBeCloseTo(0)
    expect(waveDisplacement(1, 0, params)).toBeCloseTo(-10)
    expect(waveDisplacement(2, 0, params)).toBeCloseTo(0)
    expect(waveDisplacement(1, 0, { ...params, direction: 'left' })).toBeCloseTo(10)
  })

  it('derives wave speed and instantaneous velocity/acceleration', () => {
    const readings = deriveWaveReadings(0.25, params)
    expect(readings.waveSpeed).toBeCloseTo(2)
    expect(waveVelocity(0, 0, params)).toBeCloseTo(10 * Math.PI)
    expect(waveAcceleration(1, 0, params)).toBeCloseTo(10 * Math.PI ** 2)
    expect(readings.probe.x).toBe(2)
  })

  it('keeps particles on fixed x positions while their y states change', () => {
    const particles = buildParticleStates(0.3, params)
    expect(particles).toHaveLength(9)
    expect(particles.map((particle) => particle.x)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8])
    expect(particles.some((particle) => Math.abs(particle.y) > 0)).toBe(true)
  })

  it('builds stable wave and probe traces for the visualizations', () => {
    expect(buildWavePoints(0, params, 41)).toHaveLength(41)
    const trace = buildProbeTrace(params, 25)
    expect(trace).toHaveLength(25)
    expect(trace[0][1]).toBeCloseTo(trace.at(-1)?.[1] ?? 0)
  })
})
