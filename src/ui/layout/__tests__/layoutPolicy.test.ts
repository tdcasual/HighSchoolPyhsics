import { describe, expect, it } from 'vitest'
import {
  clamp,
  resolveLayoutTier,
} from '../layoutPolicy'

describe('layoutPolicy', () => {
  it('resolves layout tier by viewport width', () => {
    expect(resolveLayoutTier(500)).toBe('mobile')
    expect(resolveLayoutTier(900)).toBe('tablet')
    expect(resolveLayoutTier(1366)).toBe('desktop')
  })

  it('clamps value within bounds', () => {
    expect(clamp(10, 20, 40)).toBe(20)
    expect(clamp(50, 20, 40)).toBe(40)
    expect(clamp(30, 20, 40)).toBe(30)
  })
})
