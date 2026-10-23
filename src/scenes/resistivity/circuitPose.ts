import { type OrbitView, type Vec3, type ViewPreset } from '../../scene3d/orbitFraming'

export type WireColor = 'red' | 'black' | 'orange' | 'blue'
export type WireLink = [string, string, WireColor, number?]

export const CIRCUIT_CAMERA = {
  fov: 30,
  near: 1,
  far: 800,
  minDistance: 30,
  maxDistance: 260,
  minPolarAngle: 0.02,
  maxPolarAngle: Math.PI - 0.08,
} as const

export const WIPER_TERMINAL_Y = 9.9
export const CLIP_TERMINAL_Y = 4.85

export function meterIntervals(range: number, division: number, centered = false): number {
  return Math.max(1, Math.round((centered ? 2 * range : range) / division))
}

export const TERMINALS: Record<string, Vec3> = {
  'bat+': [-35, 3.1, -9.9],
  'bat-': [-27, 3.1, -9.9],
  sw1: [-21, 2.48, -11.2],
  sw2: [-13, 2.48, -11.2],
  'rh-a': [-13.2, 2.2, -11.2],
  'rh-b': [17.2, 2.2, -11.2],
  'A−': [25 - 3.2, 8.45, -12.5 + 1.4],
  'A0.6': [25, 8.45, -11.1],
  A3: [25 + 3.2, 8.45, -11.1],
  'V−': [8 - 3.2, 8.45, -1.5 + 1.4],
  V3: [8, 8.45, -0.1],
  V15: [8 + 3.2, 8.45, -0.1],
  wA: [-25, CLIP_TERMINAL_Y, 11.2],
}

export function clipX(lengthCm: number): number {
  return -25 + Math.min(50, Math.max(10, lengthCm))
}

export function sliderX(slider: number): number {
  return -11 + Math.min(1, Math.max(0, slider)) * 26
}

export function bladeRotation(closed: boolean): number {
  return closed ? 0 : (58 * Math.PI) / 180
}

export function needleRotation(fraction: number): number {
  const clamped = Math.max(-0.03, Math.min(1.04, fraction))
  return -(clamped - 0.5) * (Math.PI / 2)
}

export function wireEnd(lengthCm: number): Vec3 {
  return [clipX(lengthCm), CLIP_TERMINAL_Y, 11.2]
}

export type CircuitPose = {
  clipX: number
  sliderX: number
  bladeRotation: number
  ammeterRotation: number
  voltmeterRotation: number
  hot: number
  wireEnd: Vec3
}

export function circuitPose(input: {
  lengthCm: number
  slider: number
  closed: boolean
  ammeterFraction: number
  voltmeterFraction: number
  temperatureRise: number
}): CircuitPose {
  return {
    clipX: clipX(input.lengthCm),
    sliderX: sliderX(input.slider),
    bladeRotation: bladeRotation(input.closed),
    ammeterRotation: needleRotation(input.ammeterFraction),
    voltmeterRotation: needleRotation(input.voltmeterFraction),
    hot: input.temperatureRise > 120 ? Math.min(1, (input.temperatureRise - 120) / 300) : 0,
    wireEnd: wireEnd(input.lengthCm),
  }
}

export function terminalPosition(key: string, pose: CircuitPose): Vec3 | null {
  if (key === 'rh-w') return [pose.sliderX, WIPER_TERMINAL_Y, -14]
  if (key === 'wP') return pose.wireEnd
  return TERMINALS[key] ?? null
}

export function circuitView(preset: ViewPreset): OrbitView {
  if (preset === 'focus') return { target: [-4, 2, 9], azimuth: 0, elevation: 0.82, radius: 82 }
  if (preset === 'top') return { target: [0, 2, -1], azimuth: 0, elevation: 1.5, radius: 120 }
  if (preset === 'front') return { target: [0, 4, -1], azimuth: 0, elevation: 0.18, radius: 110 }
  return { target: [0, 3, -1], azimuth: -0.02, elevation: 0.7, radius: 96 }
}

export function circuitWires(input: {
  step: number
  control: 'limit' | 'divider'
  method: 'external' | 'internal'
  ammeter: 'A06' | 'A3'
  voltmeter: 'V3' | 'V15'
  ivMode?: boolean
  voltage?: number
}): WireLink[] {
  if (input.step < 1) return []
  const ammeter = input.ammeter === 'A06' ? 'A0.6' : 'A3'
  const voltmeter = input.voltmeter === 'V3' ? 'V3' : 'V15'
  if (input.ivMode) {
    const wires: WireLink[] = [['bat+', 'sw1', 'red']]
    if ((input.voltage ?? 0) < 0) {
      wires.push(['sw2', 'wP', 'red'], ['wA', 'A−', 'black'], [ammeter, 'bat-', 'black'])
    } else {
      wires.push(['sw2', ammeter, 'red'], ['A−', 'wA', 'black'], ['wP', 'bat-', 'black'])
    }
    wires.push([voltmeter, 'wA', 'orange'], ['V−', 'wP', 'blue'])
    return wires
  }
  const wires: WireLink[] = [['bat+', 'sw1', 'red']]
  if (input.control === 'limit') {
    wires.push(['sw2', 'rh-a', 'red'], ['rh-w', ammeter, 'red', 5], ['A−', 'wA', 'black'], ['wP', 'bat-', 'black'])
  } else {
    wires.push(
      ['sw2', 'rh-b', 'red'],
      ['bat-', 'rh-a', 'black'],
      ['rh-w', ammeter, 'red', 5],
      ['A−', 'wA', 'black'],
      ['wP', 'rh-a', 'black'],
    )
  }
  if (input.step >= 2) {
    wires.push(input.method === 'external' ? [voltmeter, 'wA', 'orange'] : [voltmeter, ammeter, 'orange'], [
      'V−',
      'wP',
      'blue',
    ])
  }
  return wires
}
