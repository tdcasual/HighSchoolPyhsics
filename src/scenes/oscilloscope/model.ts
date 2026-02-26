export type Waveform = 'sine' | 'square' | 'triangle' | 'sawtooth'

export type SignalConfig = {
  waveform: Waveform
  amplitude: number
  frequencyHz: number
  phaseRad: number
  dcOffset: number
}

export type OscilloscopeConfig = {
  xSignal: SignalConfig
  ySignal: SignalConfig
}

type SignalReadings = {
  frequencyHz: number
  periodS: number
  vpp: number
  vrms: number
}

export type OscilloscopeReadings = {
  x: SignalReadings
  y: SignalReadings
}

function toPhase(signal: SignalConfig, timeS: number): number {
  const raw = 2 * Math.PI * signal.frequencyHz * timeS + signal.phaseRad
  return ((raw % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
}

function unitWave(signal: SignalConfig, timeS: number): number {
  const phase = toPhase(signal, timeS)
  const cycle = phase / (2 * Math.PI)

  if (signal.waveform === 'square') {
    return phase < Math.PI ? 1 : -1
  }
  if (signal.waveform === 'triangle') {
    return cycle < 0.5 ? 4 * cycle - 1 : 3 - 4 * cycle
  }
  if (signal.waveform === 'sawtooth') {
    return 2 * cycle - 1
  }
  return Math.sin(phase)
}

export function sampleSignal(signal: SignalConfig, timeS: number): number {
  return signal.dcOffset + signal.amplitude * unitWave(signal, timeS)
}

function acVrms(signal: SignalConfig): number {
  const amplitude = Math.abs(signal.amplitude)
  if (signal.waveform === 'square') {
    return amplitude
  }
  if (signal.waveform === 'triangle' || signal.waveform === 'sawtooth') {
    return amplitude / Math.sqrt(3)
  }
  return amplitude / Math.sqrt(2)
}

function deriveSignalReadings(signal: SignalConfig): SignalReadings {
  const amplitude = Math.abs(signal.amplitude)
  const dc = signal.dcOffset
  const ac = acVrms(signal)

  return {
    frequencyHz: signal.frequencyHz,
    periodS: signal.frequencyHz === 0 ? Number.POSITIVE_INFINITY : 1 / signal.frequencyHz,
    vpp: amplitude * 2,
    vrms: Math.sqrt(ac * ac + dc * dc),
  }
}

export function deriveOscilloscopeReadings(config: OscilloscopeConfig): OscilloscopeReadings {
  return {
    x: deriveSignalReadings(config.xSignal),
    y: deriveSignalReadings(config.ySignal),
  }
}
