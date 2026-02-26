import { describe, expect, it } from 'vitest'
import {
  deriveOscilloscopeReadings,
  sampleSignal,
  type OscilloscopeConfig,
  type SignalConfig,
} from './model'

describe('oscilloscope signal model', () => {
  it('samples a sine signal by amplitude/frequency/phase', () => {
    const signal: SignalConfig = {
      waveform: 'sine',
      amplitude: 4,
      frequencyHz: 50,
      phaseRad: Math.PI / 2,
      dcOffset: 0,
    }

    const value = sampleSignal(signal, 0)
    expect(value).toBeCloseTo(4)
  })

  it('supports custom U-t relations for x and y deflection fields', () => {
    const config: OscilloscopeConfig = {
      xSignal: {
        waveform: 'sawtooth',
        amplitude: 8,
        frequencyHz: 2,
        phaseRad: 0,
        dcOffset: -1,
      },
      ySignal: {
        waveform: 'triangle',
        amplitude: 6,
        frequencyHz: 3,
        phaseRad: 0,
        dcOffset: 0.5,
      },
    }

    const readings = deriveOscilloscopeReadings(config)

    expect(readings.x.frequencyHz).toBe(2)
    expect(readings.y.frequencyHz).toBe(3)
    expect(readings.x.vpp).toBe(16)
    expect(readings.y.vpp).toBe(12)
  })
})
