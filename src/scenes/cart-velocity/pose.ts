import { orbitPosition, type OrbitView, type Vec3, type ViewPreset } from '../measuring-tools/pose'
import { at, dots, hangingMass, hookAcceleration, type MotionInput } from './model'

export const SCENE_SCALE = 4.4
export const CART_X0 = -2.8
export const WHEEL_RADIUS = 0.15
export const PULLEY_X = 5.02
export const PULLEY_RADIUS = 0.11
export const HOOK = { x: 0.56, y: 0.3 }
export const CART_Y = 0.14

export const CART_CAMERA = {
  fov: 35,
  near: 0.05,
  far: 100,
  minDistance: 6,
  maxDistance: 23,
  minPolarAngle: Math.PI / 2 - 1.53,
  maxPolarAngle: Math.PI / 2 - 0.09,
} as const

export type CartStage = 'observe' | 'assemble' | 'run' | 'measure' | 'graph'
export type CartSkin = 'classic' | 'panda' | 'rocket'

export type CartPose = {
  x: number
  v: number
  cartX: number
  wheelRotation: number
  strikerY: number
  tapeLength: number
  tapeX: number
  dots: Array<{ x: number; count: boolean }>
  pulleyY: number
  pulleyRotation: number
  weightY: number
  discCount: number
  guideVisible: boolean
  cartVisible: boolean
  timerVisible: boolean
  tapeVisible: boolean
  powerVisible: boolean
  pulleyVisible: boolean
  arrowVisible: boolean
  arrowLength: number
}

export function motionOf(input: { hooks: number; v0: number; dh: number; time: number }): MotionInput {
  return { a: hookAcceleration(input.hooks), v0: input.v0, dh: input.dh }
}

export function cartPose(input: {
  time: number
  hooks: number
  v0: number
  dh: number
  group: number
  stage: CartStage
  assembly: number
}): CartPose {
  const motion = motionOf(input)
  const sample = at(input.time, motion)
  const cartX = CART_X0 + sample.x * SCENE_SCALE
  const tapeLength = cartX - 0.55 + 3.95
  const hookY = CART_Y + HOOK.y
  const topY = hookY + input.dh * SCENE_SCALE
  const pulleyY = topY - PULLEY_RADIUS
  const marks = dots(input.time, motion)
  const assembling = input.stage === 'assemble'
  const mass = hangingMass(motion)
  return {
    x: sample.x,
    v: sample.v,
    cartX,
    wheelRotation: -sample.x * SCENE_SCALE / WHEEL_RADIUS,
    strikerY: 0.43 + 0.02 * Math.sin(input.time * 50 * Math.PI * 2),
    tapeLength,
    tapeX: -3.95 + tapeLength / 2,
    dots: marks.map((mark) => ({
      x: -3.95 + (sample.x - mark.x) * SCENE_SCALE,
      count: mark.index % input.group === 0,
    })),
    pulleyY,
    pulleyRotation: -sample.x * SCENE_SCALE / PULLEY_RADIUS,
    weightY: pulleyY - 0.3 - sample.x * SCENE_SCALE,
    discCount: Math.max(1, Math.min(6, Math.round(mass / 0.01))),
    guideVisible: Math.abs(input.dh) >= 0.0025,
    cartVisible: !assembling || input.assembly >= 1,
    timerVisible: !assembling || input.assembly >= 2,
    tapeVisible: !assembling || input.assembly >= 3,
    powerVisible: !assembling || input.assembly >= 4,
    pulleyVisible: (!assembling || input.assembly >= 5) && mass > 0,
    arrowVisible: input.stage === 'run' && input.time > 0,
    arrowLength: 0.3 + sample.v * 1.5,
  }
}

export function cartView(preset: ViewPreset): OrbitView {
  if (preset === 'front') return { target: [0, 0.1, 0], azimuth: 0, elevation: 0.14, radius: 11.7 }
  if (preset === 'top') return { target: [0, 0.1, 0], azimuth: 0, elevation: 1.53, radius: 11.7 }
  if (preset === 'focus') return { target: [-2.2, 0.8, 0], azimuth: 0.45, elevation: 0.48, radius: 7.6 }
  return { target: [0, 0.1, 0], azimuth: 0.28, elevation: 0.62, radius: 11.7 }
}

export function cartCameraPosition(preset: ViewPreset): Vec3 {
  return orbitPosition(cartView(preset))
}
