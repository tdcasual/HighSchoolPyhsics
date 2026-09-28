import { describe, expect, it } from 'vitest'
import { buildParticleStates, buildProbeTrace, buildWavePoints, deriveWaveReadings, hasWaveReached, phaseAt, waveAcceleration, waveArrivalTime, waveDisplacement, wavefrontPosition, waveSpeed, waveVelocity } from './model'

const params = { amplitude: 10, wavelength: 4, period: 2, direction: 'right' as const }

describe('wave-state model', () => {
  it('holds each particle still until the wavefront arrives, then follows the traveling-wave phase', () => {
    expect(waveDisplacement(0, 0, params)).toBeCloseTo(0)
    expect(waveDisplacement(1, 0, params)).toBeCloseTo(0)
    expect(waveDisplacement(1, 1, params)).toBeCloseTo(10)
    expect(waveDisplacement(1, 0, { ...params, direction: 'left' })).toBeCloseTo(0)
    expect(waveDisplacement(1, 4, { ...params, direction: 'left' })).toBeCloseTo(10)
  })

  it('derives wave speed and instantaneous velocity/acceleration', () => {
    const readings = deriveWaveReadings(0.25, params, 2)
    expect(readings.waveSpeed).toBeCloseTo(2)
    expect(waveVelocity(0, 0, params)).toBeCloseTo(10 * Math.PI)
    expect(waveAcceleration(1, 1, params)).toBeCloseTo(-10 * Math.PI ** 2)
    expect(readings.probe.x).toBe(2)
    expect(readings.probeReached).toBe(false)
  })


  it('derives rightward and leftward wavefront arrival from v=lambda/T', () => {
    expect(waveSpeed(params)).toBeCloseTo(2)
    expect(waveArrivalTime(6, params)).toBeCloseTo(3)
    expect(waveArrivalTime(6, { ...params, direction: 'left' })).toBeCloseTo(1)
    expect(wavefrontPosition(1, params)).toBeCloseTo(2)
    expect(wavefrontPosition(1, { ...params, direction: 'left' })).toBeCloseTo(6)
    expect(hasWaveReached(1, 0.5, params)).toBe(true)
    expect(hasWaveReached(1.01, 0.5, params)).toBe(false)
  })

  it('uses the selected start direction for velocity and harmonic restoring acceleration', () => {
    const downward = { ...params, startDirection: 'down' as const }
    expect(waveVelocity(0, 0, params)).toBeGreaterThan(0)
    expect(waveVelocity(0, 0, downward)).toBeLessThan(0)
    expect(waveDisplacement(0, 0.5, downward)).toBeCloseTo(-10)
    expect(waveAcceleration(0, 0.5, downward)).toBeCloseTo(10 * Math.PI ** 2)
    expect(phaseAt(1, 1, params)).toBeCloseTo(Math.PI / 2)
  })

  it('keeps particles on fixed x positions while their y states change', () => {
    const particles = buildParticleStates(0.3, params)
    expect(particles).toHaveLength(9)
    expect(particles.map((particle) => particle.x)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8])
    expect(particles.some((particle) => Math.abs(particle.y) > 0)).toBe(true)
  })

  it('builds stable wave and probe traces for the visualizations', () => {
    expect(buildWavePoints(0, params, 41)).toHaveLength(41)
    const trace = buildProbeTrace(params, 25, 2)
    expect(trace).toHaveLength(25)
    expect(trace[0]).toEqual([0, 0])
    expect(trace[0][1]).toBeCloseTo(trace.at(-1)?.[1] ?? 0)
    expect(trace.at(-1)?.[0]).toBeCloseTo(waveArrivalTime(2, params) + params.period)
    expect(trace.every(([time], index) => index === 0 || time > trace[index - 1][0])).toBe(true)
  })
})
