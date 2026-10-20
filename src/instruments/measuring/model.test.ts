import { describe, expect, it } from 'vitest'
import { CALIPER_RANGE_MM, MAIN_SCALE_END_MM, caliperReading, checkCaliper, checkMicrometer, micrometerReading } from './model'

describe('measuring instrument readings', () => {
  it('reads a 20-division caliper without estimating an extra digit', () => {
    const reading = caliperReading(12.35, 20)
    expect(reading.value).toBe(12.35)
    expect(reading.main).toBe(12)
    expect(reading.line).toBe(7)
    expect(reading.precision).toBe(0.05)
    expect(reading.text).toBe('12.35')
    expect(reading.offsets[7]).toBeCloseTo(0, 8)
  })

  it('rolls the vernier line into the next main-scale millimetre', () => {
    const reading = caliperReading(12.999, 10)
    expect(reading.main).toBe(13)
    expect(reading.line).toBe(0)
    expect(reading.text).toBe('13.0')
  })

  it('rejects a caliper answer that multiplies by the vernier spacing', () => {
    const result = checkCaliper('18.65', 12.35, 20)
    expect(result.ok).toBe(false)
    expect(result.notes.join('')).toContain('精度')
  })

  it('accepts the canonical caliper format', () => {
    expect(checkCaliper('12.35', 12.35, 20).ok).toBe(true)
    expect(checkCaliper('12.350', 12.35, 20).ok).toBe(false)
  })

  it('splits a micrometer reading into the fixed scale and the thimble', () => {
    const above = micrometerReading(5.737)
    expect(above.fixed).toBe(5.5)
    expect(above.halfLine).toBe(true)
    expect(above.divisions).toBeCloseTo(23.7, 8)
    expect(above.text).toBe('5.737')

    const below = micrometerReading(5.237)
    expect(below.fixed).toBe(5)
    expect(below.halfLine).toBe(false)
    expect(below.divisions).toBeCloseTo(23.7, 8)
  })

  it('requires the estimated thousandth to match instead of accepting a two-thousandth error', () => {
    expect(checkMicrometer('5.237', 5.237).ok).toBe(true)
    expect(checkMicrometer('5.238', 5.237).ok).toBe(false)
    expect(checkMicrometer('5.239', 5.237).ok).toBe(false)
  })

  it('keeps a negative zero-error reading at the sleeve zero and on the signed thimble scale', () => {
    const reading = micrometerReading(-0.05)
    expect(reading.fixed).toBe(0)
    expect(reading.divisions).toBeCloseTo(-5, 8)
    expect(reading.halfLine).toBe(false)
    expect(reading.text).toBe('-0.050')
  })

  it('flags a missed half-millimetre line', () => {
    const result = checkMicrometer('5.237', 5.737)
    expect(result.ok).toBe(false)
    expect(result.notes.join('')).toContain('半毫米')
  })

  it('graduates the main scale far enough for every aligned vernier line in range', () => {
    for (const n of [10, 20, 50] as const) {
      for (let step = 0; step <= CALIPER_RANGE_MM * n; step += 1) {
        const reading = caliperReading(step / n, n)
        expect(reading.main + reading.line).toBeLessThanOrEqual(MAIN_SCALE_END_MM)
      }
    }
  })
})
