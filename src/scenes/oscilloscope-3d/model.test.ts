import { describe, expect, it } from 'vitest'
import { buildNormalTrace, buildXYTrace, deriveMeasurement, deriveXYConclusion, evaluateWaveform, xyPresetSettings } from './model'

describe('oscilloscope-3d model', () => {
  it('derives the screen divisions and warnings from VOLTS/DIV and TIME/DIV', () => {
    const result = deriveMeasurement({ amplitudeV: 2, frequencyHz: 200, voltsDiv: 1, timeDiv: 1 })
    expect(result.peakToPeakV).toBe(4)
    expect(result.periodMs).toBeCloseTo(5)
    expect(result.verticalDivisions).toBe(4)
    expect(result.horizontalDivisions).toBe(5)
    expect(result.warnings).toEqual([])
  })
  it('supports the reference waveform families', () => {
    expect(evaluateWaveform('square', 0)).toBe(1)
    expect(evaluateWaveform('square', Math.PI)).toBe(-1)
    expect(evaluateWaveform('sawtooth', 0)).toBe(-1)
    expect(buildNormalTrace({ wave: 'sine', amplitudeV: 2, frequencyHz: 200, voltsDiv: 1, timeDiv: 1, elapsed: 0, trigger: true })).toHaveLength(240)
  })
  it('builds an XY circle preset and explains the phase relation', () => {
    const xy = xyPresetSettings('circle')
    expect(buildXYTrace({ xy, elapsed: 0 })).toHaveLength(240)
    expect(deriveXYConclusion(xy)).toContain('椭圆')
  })
})
