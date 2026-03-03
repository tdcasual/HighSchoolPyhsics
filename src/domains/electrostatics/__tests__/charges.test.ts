import { describe, expect, it } from 'vitest'
import { nextChargeId } from '../charges'

describe('electrostatics charge utilities', () => {
  it('generates the next C-id from the largest existing C-index', () => {
    const charges = [{ id: 'C1' }, { id: 'C3' }, { id: 'C9' }]
    expect(nextChargeId(charges)).toBe('C10')
  })

  it('ignores non-C ids and starts from C1 when no valid ids exist', () => {
    const charges = [{ id: 'Q1' }, { id: 'node-7' }]
    expect(nextChargeId(charges)).toBe('C1')
    expect(nextChargeId([])).toBe('C1')
  })
})
