import { describe, expect, it } from 'vitest'
import { compileVoltageExpression } from './expression'

describe('voltage expression compiler', () => {
  it('evaluates common U-t expressions with t in seconds', () => {
    const compiled = compileVoltageExpression('5*sin(2*pi*50*t)')

    expect(compiled.error).toBeNull()
    expect(compiled.evaluate(0)).toBeCloseTo(0)
    expect(compiled.evaluate(0.005)).toBeCloseTo(5, 5)
  })

  it('supports scientific notation literals in formulas', () => {
    const dc = compileVoltageExpression('1e-3')
    const ac = compileVoltageExpression('5e3*sin(2*pi*t)')

    expect(dc.error).toBeNull()
    expect(ac.error).toBeNull()
    expect(dc.evaluate(0.2)).toBeCloseTo(0.001, 8)
    expect(ac.evaluate(0.25)).toBeCloseTo(5000, 5)
  })

  it('returns a safe fallback when expression is invalid', () => {
    const compiled = compileVoltageExpression('window.alert(1)')

    expect(compiled.error).toMatch(/不支持|非法|invalid/i)
    expect(compiled.evaluate(0.2)).toBe(0)
  })
})
