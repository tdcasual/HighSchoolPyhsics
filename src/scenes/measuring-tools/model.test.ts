import { describe, expect, it } from 'vitest'
import { caliperReading, checkCaliper, checkMicrometer, micrometerReading } from './model'

describe('measuring-tools readings', () => {
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

  it('flags a missed half-millimetre line', () => {
    const result = checkMicrometer('5.237', 5.737)
    expect(result.ok).toBe(false)
    expect(result.notes.join('')).toContain('半毫米')
  })
})
