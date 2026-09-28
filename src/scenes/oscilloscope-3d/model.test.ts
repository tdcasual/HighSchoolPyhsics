import { describe, expect, it } from 'vitest'
import { buildElectronBeamPath, buildNormalTrace, buildXYTrace, CRT_SCREEN_HALF_HEIGHT, CRT_SCREEN_HALF_WIDTH, deriveMeasurement, deriveXYConclusion, evaluateWaveform, xyPresetSettings } from './model'

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
  it('keeps the displayed electron beam inside the calibrated CRT grid', () => {
    const measurement = deriveMeasurement({ amplitudeV: 4, frequencyHz: 500, voltsDiv: 0.5, timeDiv: 0.5 })
    const beamPath = buildElectronBeamPath({
      mode: 'measure', elapsed: 0.0005, wave: 'sine', amplitudeV: 4, frequencyHz: 500,
      voltsDiv: 0.5, timeDiv: 0.5, trigger: true, xy: xyPresetSettings('circle'),
    })
    const screenPoint = beamPath.at(-1)

    expect(measurement.verticalDivisions).toBe(16)
    expect(measurement.warnings).toContain('波形超出屏幕垂直范围，请增大 VOLTS/DIV。')
    expect(beamPath[2][1]).toBe(0)
    expect(Math.abs(screenPoint?.[1] ?? Infinity)).toBeLessThanOrEqual(CRT_SCREEN_HALF_HEIGHT)
    expect(Math.abs(screenPoint?.[2] ?? Infinity)).toBeLessThanOrEqual(CRT_SCREEN_HALF_WIDTH)
  })

  it('maps equal XY amplitudes to a circle using the screen’s 10-by-8 division calibration', () => {
    const xy = xyPresetSettings('circle')
    const trace = buildXYTrace({ xy, elapsed: 0 })
    const maxX = Math.max(...trace.map(([x]) => x * CRT_SCREEN_HALF_WIDTH))
    const maxY = Math.max(...trace.map(([, y]) => y * CRT_SCREEN_HALF_HEIGHT))

    expect(trace).toHaveLength(240)
    expect(maxX).toBeCloseTo(maxY, 2)
    expect(deriveXYConclusion(xy)).toContain('圆')
  })
})
