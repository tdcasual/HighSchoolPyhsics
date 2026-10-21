import { type OrbitView, type Vec3, type ViewPreset } from '../../scene3d/orbitFraming'
import { RANGES, type MeasureTarget, type RangeKey } from './model'
import type { ContactMethod } from './state'

export const METER_CAMERA = {
  fov: 30,
  near: 1,
  far: 600,
  minDistance: 18,
  maxDistance: 140,
  minPolarAngle: 0.05,
  maxPolarAngle: Math.PI - 0.08,
} as const

export const NEEDLE_PIVOT_Y = 12.2 - 5.57 / 2 - 0.18 * 5.57
export const NEEDLE_LENGTH = 5.57 * 1.06
export const NEEDLE_SPAN = 48 * Math.PI / 180

export function needleRotation(fraction: number): number {
  const clamped = Math.max(-0.035, Math.min(1.04, fraction))
  return -(clamped - 0.5) * 2 * NEEDLE_SPAN
}

export function knobRotation(range: RangeKey): number {
  const index = Math.max(0, RANGES.findIndex((item) => item.key === range))
  return (150 - index * 30) * Math.PI / 180
}

export function screwRotation(mechanicalSlider: number): number {
  return (mechanicalSlider / 5) * 3
}

export function ohmKnobRotation(ohmSlider: number): number {
  return (ohmSlider / 10) * 3
}

export const POSTS: Record<string, Vec3> = {
  'cell+': [-5.6, 2.7, 9],
  'cell-': [-14.4, 2.7, 9],
  'loop-a': [-2.2, 2.7, 15.2],
  'loop-b': [7.8, 2.7, 15.2],
  'va-a': [7.4, 2.7, 15.2],
  'va-b': [10.6, 2.7, 15.2],
  'va-before-ammeter': [-2.2, 2.7, 15.2],
  'res-a': [-2.6, 2.7, 9],
  'res-b': [2.6, 2.7, 9],
  'diode-anode': [6.6, 2.7, 9],
  'diode-cathode': [11.4, 2.7, 9],
}

const REST_RED: Vec3 = [12, 2.4, 3]
const REST_BLACK: Vec3 = [-12, 2.4, 3]

export function probeTips(target: MeasureTarget, swapped: boolean, contactMethod: ContactMethod = 'external'): { red: Vec3; black: Vec3 } {
  const pairs: Partial<Record<MeasureTarget, [Vec3, Vec3]>> = {
    cell: [POSTS['cell+'], POSTS['cell-']],
    loopV: contactMethod === 'external'
      ? [POSTS['va-a'], POSTS['va-b']]
      : [POSTS['va-before-ammeter'], POSTS['va-b']],
    loopI: [POSTS['loop-a'], POSTS['loop-b']],
    resistor: [POSTS['res-a'], POSTS['res-b']],
    diode: [POSTS['diode-cathode'], POSTS['diode-anode']],
    short: [[-0.3, 3.2, 4.4], [0.3, 3.2, 4.4]],
  }
  const pair = pairs[target]
  if (!pair) return { red: REST_RED, black: REST_BLACK }
  return swapped ? { red: pair[1], black: pair[0] } : { red: pair[0], black: pair[1] }
}

export function meterView(preset: ViewPreset): OrbitView {
  if (preset === 'focus') return { target: [0, 9.5, -2], azimuth: 0, elevation: 0.3, radius: 30 }
  if (preset === 'front') return { target: [0, 7, 2], azimuth: 0, elevation: 0.12, radius: 58 }
  if (preset === 'top') return { target: [0, 4, 8], azimuth: 0, elevation: 1.45, radius: 60 }
  return { target: [0, 6, 6], azimuth: 0.18, elevation: 0.5, radius: 62 }
}


export type MeterPose = {
  needle: number
  knob: number
  screw: number
  ohmKnob: number
  target: MeasureTarget
  contactMethod: ContactMethod
  red: Vec3
  black: Vec3
}

export function meterPose(input: {
  fraction: number
  range: RangeKey
  mechanicalSlider: number
  ohmSlider: number
  target: MeasureTarget
  swapped: boolean
  contactMethod?: ContactMethod
}): MeterPose {
  const contactMethod = input.contactMethod ?? 'external'
  const probes = probeTips(input.target, input.swapped, contactMethod)
  return {
    needle: needleRotation(input.fraction),
    knob: knobRotation(input.range),
    screw: screwRotation(input.mechanicalSlider),
    ohmKnob: ohmKnobRotation(input.ohmSlider),
    target: input.target,
    contactMethod,
    red: probes.red,
    black: probes.black,
  }
}
