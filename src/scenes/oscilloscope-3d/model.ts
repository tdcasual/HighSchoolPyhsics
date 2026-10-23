export type OscilloscopeMode = 'structure' | 'scan' | 'measure' | 'xy'
export type BasicWaveform = 'sine' | 'square' | 'triangle'
export type XYWaveform = BasicWaveform | 'sawtooth' | 'dc' | 'zero'
export type XYPreset = 'circle' | 'a' | 'b' | 'c' | 'd' | 'custom'

export const CRT_SCREEN_HALF_WIDTH = 1.6
export const CRT_SCREEN_HALF_HEIGHT = 1.28

export type XYSettings = {
  preset: XYPreset
  xWave: XYWaveform
  yWave: XYWaveform
  xAmplitude: number
  yAmplitude: number
  xRate: number
  yRate: number
  phaseDeg: number
}

export type MeasurementInput = {
  amplitudeV: number
  frequencyHz: number
  voltsDiv: number
  timeDiv: number
}

export type MeasurementReadout = {
  peakToPeakV: number
  periodMs: number
  verticalDivisions: number
  horizontalDivisions: number
  warnings: string[]
}

export const DEFAULT_XY_SETTINGS: XYSettings = {
  preset: 'circle',
  xWave: 'sine',
  yWave: 'sine',
  xAmplitude: 3,
  yAmplitude: 3,
  xRate: 1,
  yRate: 1,
  phaseDeg: 90,
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function evaluateWaveform(kind: XYWaveform, phase: number): number {
  const normalized = (((phase / (Math.PI * 2)) % 1) + 1) % 1
  switch (kind) {
    case 'square':
      return normalized < 0.5 ? 1 : -1
    case 'triangle':
      return 1 - 4 * Math.abs(Math.round(normalized - 0.25) - (normalized - 0.25))
    case 'sawtooth':
      return 2 * normalized - 1
    case 'dc':
      return 1
    case 'zero':
      return 0
    case 'sine':
    default:
      return Math.sin(phase)
  }
}

export function deriveBeamProgress(mode: OscilloscopeMode, elapsed: number, timeDivMs: number): number {
  const sweepPeriodS = mode === 'xy' ? 1 : Math.max(0.001, (timeDivMs * 10) / 1000)
  const progress = elapsed / sweepPeriodS
  return progress - Math.floor(progress)
}

export function deriveMeasurement(input: MeasurementInput): MeasurementReadout {
  const amplitudeV = Math.max(0, input.amplitudeV)
  const frequencyHz = Math.max(0.001, input.frequencyHz)
  const voltsDiv = Math.max(0.001, input.voltsDiv)
  const timeDiv = Math.max(0.001, input.timeDiv)
  const peakToPeakV = amplitudeV * 2
  const periodMs = 1000 / frequencyHz
  const verticalDivisions = peakToPeakV / voltsDiv
  const horizontalDivisions = periodMs / timeDiv
  const warnings: string[] = []
  if (verticalDivisions > 8) warnings.push('波形超出屏幕垂直范围，请增大 VOLTS/DIV。')
  if (horizontalDivisions > 10) warnings.push('一个周期超过屏幕宽度，请增大 TIME/DIV。')
  if (horizontalDivisions < 1) warnings.push('一个周期小于一格，可减小 TIME/DIV 观察细节。')
  return { peakToPeakV, periodMs, verticalDivisions, horizontalDivisions, warnings }
}

export function buildNormalTrace(options: {
  wave: BasicWaveform
  amplitudeV: number
  frequencyHz: number
  voltsDiv: number
  timeDiv: number
  elapsed: number
  trigger: boolean
  samples?: number
}): Array<[number, number]> {
  const samples = options.samples ?? 240
  const timeWindowS = Math.max(0.001, (options.timeDiv * 10) / 1000)
  const phaseOffset = options.trigger ? 0 : options.elapsed * options.frequencyHz * Math.PI * 2
  const points: Array<[number, number]> = []
  for (let index = 0; index < samples; index += 1) {
    const x = (index / (samples - 1)) * 2 - 1
    const t = (index / (samples - 1)) * timeWindowS
    const phase = t * options.frequencyHz * Math.PI * 2 + phaseOffset
    const raw = evaluateWaveform(options.wave, phase)
    const y = clamp((raw * options.amplitudeV) / Math.max(0.001, options.voltsDiv * 4), -1, 1)
    points.push([x, y])
  }
  return points
}

export function buildXYTrace(options: { xy: XYSettings; elapsed: number; samples?: number }): Array<[number, number]> {
  const samples = options.samples ?? 240
  const phase = (options.xy.phaseDeg * Math.PI) / 180
  const points: Array<[number, number]> = []
  for (let index = 0; index < samples; index += 1) {
    const progress = index / (samples - 1)
    const t = progress * Math.PI * 2
    const x = (evaluateWaveform(options.xy.xWave, t * options.xy.xRate + phase) * options.xy.xAmplitude) / 5
    const y = (evaluateWaveform(options.xy.yWave, t * options.xy.yRate) * options.xy.yAmplitude) / 4
    points.push([clamp(x, -1, 1), clamp(y, -1, 1)])
  }
  return points
}

export function buildElectronBeamPath(options: {
  mode: OscilloscopeMode
  elapsed: number
  wave: BasicWaveform
  amplitudeV: number
  frequencyHz: number
  voltsDiv: number
  timeDiv: number
  trigger: boolean
  xy: XYSettings
}): Array<[number, number, number]> {
  const trace =
    options.mode === 'xy'
      ? buildXYTrace({ xy: options.xy, elapsed: options.elapsed, samples: 44 })
      : buildNormalTrace({
          wave: options.wave,
          amplitudeV: options.amplitudeV,
          frequencyHz: options.frequencyHz,
          voltsDiv: options.voltsDiv,
          timeDiv: options.timeDiv,
          elapsed: options.elapsed,
          trigger: options.trigger,
          samples: 44,
        })
  const progress = deriveBeamProgress(options.mode, options.elapsed, options.timeDiv)
  const active = trace[Math.floor(progress * (trace.length - 1))] ?? [0, 0]
  const screenY = clamp(active[1], -1, 1) * CRT_SCREEN_HALF_HEIGHT
  const screenZ = clamp(active[0], -1, 1) * CRT_SCREEN_HALF_WIDTH
  return [
    [-4.55, 0, 0],
    [-3.2, 0, 0],
    [-1.15, 0, 0],
    [1.05, screenY * 0.22, 0],
    [3.15, screenY * 0.72, screenZ * 0.72],
    [4.75, screenY, screenZ],
  ]
}

export function xyPresetSettings(preset: XYPreset): XYSettings {
  switch (preset) {
    case 'a':
      return {
        ...DEFAULT_XY_SETTINGS,
        preset,
        xWave: 'sawtooth',
        yWave: 'square',
        xAmplitude: 3,
        yAmplitude: 2,
        phaseDeg: 0,
      }
    case 'b':
      return {
        ...DEFAULT_XY_SETTINGS,
        preset,
        xWave: 'square',
        yWave: 'sine',
        xAmplitude: 3,
        yAmplitude: 3,
        phaseDeg: 0,
      }
    case 'c':
      return {
        ...DEFAULT_XY_SETTINGS,
        preset,
        xWave: 'sine',
        yWave: 'sawtooth',
        xAmplitude: 3,
        yAmplitude: 3,
        phaseDeg: 0,
      }
    case 'd':
      return { ...DEFAULT_XY_SETTINGS, preset, xWave: 'square', yWave: 'dc', xAmplitude: 3, yAmplitude: 2, phaseDeg: 0 }
    case 'custom':
      return { ...DEFAULT_XY_SETTINGS, preset: 'custom' }
    case 'circle':
    default:
      return { ...DEFAULT_XY_SETTINGS, preset: 'circle' }
  }
}

export function deriveXYConclusion(xy: XYSettings): string {
  if (xy.xWave === 'sine' && xy.yWave === 'sine' && xy.xRate === 1 && xy.yRate === 1) {
    const phase = ((xy.phaseDeg % 360) + 360) % 360
    if (phase === 90 || phase === 270) return '两路同频、相位差 90°，轨迹为椭圆；振幅相等时为圆。'
    if (phase === 0 || phase === 180) return '两路同频、同相或反相，轨迹退化为直线。'
  }
  return 'X:Y 频率比 ' + xy.xRate + ':' + xy.yRate + '，轨迹由两路波形、振幅和相位共同决定。'
}
