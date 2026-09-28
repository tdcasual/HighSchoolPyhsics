import { describe, expect, it } from 'vitest'
import { COMMON_ELECTRIC_FIELD_PRESETS } from './presets'
import { compileVoltageExpression } from './expression'

describe('voltage expression compiler', () => {
  it('evaluates common U-t expressions with t in seconds', () => {
    const compiled = compileVoltageExpression('5*sin(2*pi*50*t)')

    expect(compiled.error).toBeNull()
    expect(compiled.evaluate(0)).toBeCloseTo(0)
    expect(compiled.evaluate(0.005)).toBeCloseTo(5, 5)
  })

  it('accepts an empty formula as zero and supports pi, e, and scientific notation', () => {
    const empty = compileVoltageExpression('  ')
    const dc = compileVoltageExpression('1e-3')
    const ac = compileVoltageExpression('5e3*sin(2*π*t)')
    const constants = compileVoltageExpression('pi + e')

    expect(empty.error).toBeNull()
    expect(empty.source).toBe('0')
    expect(empty.evaluate(1)).toBe(0)
    expect(dc.error).toBeNull()
    expect(ac.error).toBeNull()
    expect(constants.error).toBeNull()
    expect(dc.evaluate(0.2)).toBeCloseTo(0.001, 8)
    expect(ac.evaluate(0.25)).toBeCloseTo(5000, 5)
    expect(constants.evaluate(0)).toBeCloseTo(Math.PI + Math.E)
  })

  it('applies conventional operator precedence, unary signs, and right-associative powers', () => {
    const arithmetic = compileVoltageExpression('2 + 3*4')
    const negativePower = compileVoltageExpression('-2^2')
    const groupedNegative = compileVoltageExpression('(-2)^2')
    const rightAssociative = compileVoltageExpression('2^3^2')
    const negativeExponent = compileVoltageExpression('2^-2')

    expect(arithmetic.error).toBeNull()
    expect(negativePower.error).toBeNull()
    expect(groupedNegative.error).toBeNull()
    expect(rightAssociative.error).toBeNull()
    expect(negativeExponent.error).toBeNull()
    expect(arithmetic.evaluate(0)).toBe(14)
    expect(negativePower.evaluate(0)).toBe(-4)
    expect(groupedNegative.evaluate(0)).toBe(4)
    expect(rightAssociative.evaluate(0)).toBe(512)
    expect(negativeExponent.evaluate(0)).toBe(0.25)
  })

  it('starts the default timebase sweep at the left edge and completes one left-to-right ramp', () => {
    const timebase = compileVoltageExpression('8*sawtooth(2*pi*2*t-pi)')

    expect(timebase.error).toBeNull()
    expect(timebase.evaluate(0)).toBeCloseTo(-8)
    expect(timebase.evaluate(0.25)).toBeCloseTo(0)
    expect(timebase.evaluate(0.5)).toBeCloseTo(-8)
    expect(timebase.evaluate(0.5 - 1e-6)).toBeGreaterThan(7.99)
  })

  it('supports nested allowed functions and all built-in presets', () => {
    const nested = compileVoltageExpression('clamp(max(abs(-3), sqrt(16)), 0, 5)')
    expect(nested.error).toBeNull()
    expect(nested.evaluate(0)).toBe(4)

    for (const preset of COMMON_ELECTRIC_FIELD_PRESETS) {
      const compiled = compileVoltageExpression(preset.value)
      expect(compiled.error, preset.label).toBeNull()
      expect(Number.isFinite(compiled.evaluate(0)), preset.label).toBe(true)
    }
  })

  it('returns zero for non-finite runtime results', () => {
    const divisionByZero = compileVoltageExpression('1/0')
    const overflow = compileVoltageExpression('10^1000')

    expect(divisionByZero.error).toBeNull()
    expect(overflow.error).toBeNull()
    expect(divisionByZero.evaluate(0)).toBe(0)
    expect(overflow.evaluate(0)).toBe(0)
  })

  it('rejects malformed, unsupported, overlong, and executable input safely', () => {
    for (const source of [
      'window.alert(1)',
      'globalThis.constructor(1)',
      'sin(',
      '1 +',
      '1 2',
      'sin()',
      'clamp(1, 2)',
      '1e999',
      '1'.repeat(513),
    ]) {
      const compiled = compileVoltageExpression(source)
      expect(compiled.error, source).toBeTruthy()
      if (source === 'window.alert(1)') {
        expect(compiled.error).toBe('公式含有非法字符: .')
      }
      expect(compiled.evaluate(0), source).toBe(0)
    }
  })
})
