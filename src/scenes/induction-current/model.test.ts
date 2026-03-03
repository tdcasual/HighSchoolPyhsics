import { describe, expect, it } from 'vitest'
import {
  deriveInductionOutcome,
  formatCurrentDirection,
  formatFluxChange,
  formatVerticalDirection,
} from './model'

describe('induction-current model', () => {
  it('maps S上(N下) + 接近 to upward induced field and counterclockwise current', () => {
    const outcome = deriveInductionOutcome({
      poleSetting: 's-top-n-down',
      motion: 'approach',
    })

    expect(outcome.originalFieldDirection).toBe('down')
    expect(outcome.fluxChange).toBe('increase')
    expect(outcome.inducedFieldDirection).toBe('up')
    expect(outcome.inducedCurrentDirection).toBe('counterclockwise')
  })

  it('maps S上(N下) + 远离 to downward induced field and clockwise current', () => {
    const outcome = deriveInductionOutcome({
      poleSetting: 's-top-n-down',
      motion: 'recede',
    })

    expect(outcome.originalFieldDirection).toBe('down')
    expect(outcome.fluxChange).toBe('decrease')
    expect(outcome.inducedFieldDirection).toBe('down')
    expect(outcome.inducedCurrentDirection).toBe('clockwise')
  })

  it('maps S下(N上) polarity to opposite current result', () => {
    const approach = deriveInductionOutcome({
      poleSetting: 's-bottom-n-up',
      motion: 'approach',
    })
    const recede = deriveInductionOutcome({
      poleSetting: 's-bottom-n-up',
      motion: 'recede',
    })

    expect(approach.originalFieldDirection).toBe('up')
    expect(approach.inducedCurrentDirection).toBe('clockwise')
    expect(recede.originalFieldDirection).toBe('up')
    expect(recede.inducedCurrentDirection).toBe('counterclockwise')
  })

  it('formats table labels with classroom-ready wording', () => {
    expect(formatVerticalDirection('up')).toBe('向上 (↑)')
    expect(formatVerticalDirection('down')).toBe('向下 (↓)')
    expect(formatFluxChange('increase')).toBe('增加 (接近)')
    expect(formatFluxChange('decrease')).toBe('减少 (远离)')
    expect(formatCurrentDirection('counterclockwise')).toBe('逆时针')
    expect(formatCurrentDirection('clockwise')).toBe('顺时针')
  })
})
