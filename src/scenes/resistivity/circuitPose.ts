import { orbitPosition, type OrbitView, type Vec3, type ViewPreset } from '../measuring-tools/pose'

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

export const TERMINALS: Record<string, Vec3> = {
  'bat+': [-35, 3.1, -9.9],
  'bat-': [-27, 3.1, -9.9],
  sw1: [-21, 2.1, -11.2],
  sw2: [-13, 2.1, -11.2],
  'rh-a': [-13.2, 2.2, -11.2],
  'rh-b': [17.2, 2.2, -11.2],
  'rh-c': [-13.2, 8.9, -14],
  'rh-d': [17.2, 8.9, -14],
  'A−': [25 - 3.2, 8.45, -12.5 + 1.4],
  'A0.6': [25, 8.45, -11.1],
  A3: [25 + 3.2, 8.45, -11.1],
  'V−': [8 - 3.2, 8.45, -1.5 + 1.4],
  V3: [8, 8.45, -0.1],
  V15: [8 + 3.2, 8.45, -0.1],
  wA: [-25, 3.9, 11.2],
  wB: [25, 3.9, 11.2],
}

export function clipX(lengthCm: number): number {
  return -25 + lengthCm
}

export function sliderX(slider: number): number {
  return -11 + slider * 26
}

export function bladeRotation(closed: boolean): number {
  return closed ? 0 : 58 * Math.PI / 180
}

export function needleRotation(fraction: number): number {
  const clamped = Math.max(-0.03, Math.min(1.04, fraction))
  return -(clamped - 0.5) * (Math.PI / 2)
}

export function wireEnd(lengthCm: number): Vec3 {
  return [clipX(lengthCm), 6.3, 11.2]
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

export function circuitView(preset: ViewPreset): OrbitView {
  if (preset === 'focus') return { target: [-4, 2, 9], azimuth: 0, elevation: 0.82, radius: 64 }
  if (preset === 'top') return { target: [0, 2, -1], azimuth: 0, elevation: 1.5, radius: 120 }
  if (preset === 'front') return { target: [0, 4, -1], azimuth: 0, elevation: 0.18, radius: 110 }
  return { target: [0, 3, -1], azimuth: -0.02, elevation: 0.7, radius: 96 }
}

export function circuitCameraPosition(preset: ViewPreset): Vec3 {
  return orbitPosition(circuitView(preset))
}

export function circuitWires(input: {
  step: number
  control: 'limit' | 'divider'
  method: 'external' | 'internal'
  ammeter: 'A06' | 'A3'
  voltmeter: 'V3' | 'V15'
}): WireLink[] {
  if (input.step < 1) return []
  const ammeter = input.ammeter === 'A06' ? 'A0.6' : 'A3'
  const voltmeter = input.voltmeter === 'V3' ? 'V3' : 'V15'
  const wires: WireLink[] = [['bat+', 'sw1', 'red']]
  if (input.control === 'limit') {
    wires.push(['sw2', 'rh-a', 'red'], ['rh-d', ammeter, 'red', 5], ['A−', 'wA', 'red'], ['wP', 'bat-', 'black'])
  } else {
    wires.push(['sw2', 'rh-b', 'red'], ['bat-', 'rh-a', 'black'], ['rh-d', ammeter, 'red', 5], ['A−', 'wA', 'red'], ['wP', 'rh-a', 'black'])
  }
  if (input.step >= 2) {
    wires.push(input.method === 'external' ? [voltmeter, 'wA', 'orange'] : [voltmeter, ammeter, 'orange'], ['V−', 'wP', 'blue'])
  }
  return wires
}
