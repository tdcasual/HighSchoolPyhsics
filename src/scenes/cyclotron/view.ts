import { DEE_TOP_Y, SCENE_Y, TRAJECTORY_Y, type Point3 } from './layout'

export const CHAMBER_BASE_RADIUS = 2.72
const CYCLOTRON_BASE_TARGET_Y = SCENE_Y - 0.9

export const CYCLOTRON_CAMERA = {
  position: [0, 4.9, 8.8] as [number, number, number],
  fov: 44,
}

export const CYCLOTRON_CONTROLS = {
  target: [0, CYCLOTRON_BASE_TARGET_Y, 0] as [number, number, number],
  minDistance: 5.8,
  maxDistance: 11.5,
  minPolarAngle: 0.28,
  maxPolarAngle: 1.2,
}

export const DEE_LABEL_Y = TRAJECTORY_Y + 0.01
export const INFO_LABEL_Y = DEE_TOP_Y + 0.018

export const POWER_FEED_LEFT_PATH: Point3[] = [
  [-0.14, DEE_LABEL_Y, 2.02],
  [-0.58, DEE_LABEL_Y, 2.16],
  [-1.02, DEE_LABEL_Y, 2.24],
]

export const POWER_FEED_RIGHT_PATH: Point3[] = POWER_FEED_LEFT_PATH.map(([x, y, z]) => [-x, y, z])

export const POWER_FEED_TERMINALS: Point3[] = [
  POWER_FEED_LEFT_PATH[POWER_FEED_LEFT_PATH.length - 1],
  POWER_FEED_RIGHT_PATH[POWER_FEED_RIGHT_PATH.length - 1],
]

export const POWER_FEED_TEXT_POSITION: Point3 = [0, DEE_LABEL_Y, 2.36]
