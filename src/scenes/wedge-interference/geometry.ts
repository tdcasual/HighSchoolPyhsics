export const WEDGE_PLATE_WIDTH = 16
export const WEDGE_PLATE_HEIGHT = 0.5
export const WEDGE_PLATE_Y = 3
export const WEDGE_PAPER_CENTER_X = WEDGE_PLATE_WIDTH / 2 - 0.3
export const WEDGE_ANGLE_MIN_DEG = 0.005
export const WEDGE_ANGLE_MAX_DEG = 0.3

const BUMP_HEIGHT_MIN_UM = 0.1
const BUMP_HEIGHT_MAX_UM = 3
const BUMP_DISPLAY_MIN_WORLD = 0.04
const BUMP_DISPLAY_MAX_WORLD = 0.22

export function visualWedgeAngleDegrees(wedgeAngleDeg: number): number {
  const physicalAngle = Math.min(WEDGE_ANGLE_MAX_DEG, Math.max(WEDGE_ANGLE_MIN_DEG, wedgeAngleDeg))
  const fraction = (physicalAngle - WEDGE_ANGLE_MIN_DEG) / (WEDGE_ANGLE_MAX_DEG - WEDGE_ANGLE_MIN_DEG)
  return 1.5 + fraction * 9.5
}

export function upperPlateGroupY(visualAngleDeg: number): number {
  const angle = (visualAngleDeg * Math.PI) / 180
  return (
    WEDGE_PLATE_Y +
    WEDGE_PLATE_HEIGHT / 2 +
    (WEDGE_PLATE_WIDTH / 2) * Math.sin(angle) +
    (WEDGE_PLATE_HEIGHT / 2) * Math.cos(angle)
  )
}

export function wedgeGapAtX(visualAngleDeg: number, xWorld: number): number {
  const angle = (visualAngleDeg * Math.PI) / 180
  return Math.max(0, (xWorld + WEDGE_PLATE_WIDTH / 2) * Math.tan(angle))
}

export function paperSpacerPose(visualAngleDeg: number): { x: number; height: number; centerY: number } {
  const height = wedgeGapAtX(visualAngleDeg, WEDGE_PAPER_CENTER_X)
  return {
    x: WEDGE_PAPER_CENTER_X,
    height,
    centerY: WEDGE_PLATE_Y + WEDGE_PLATE_HEIGHT / 2 + height / 2,
  }
}

export function bumpCenterX(positionFraction: number): number {
  const fraction = Math.min(0.9, Math.max(0.1, positionFraction))
  return (fraction - 0.5) * WEDGE_PLATE_WIDTH
}

/** Display bump height is intentionally enlarged; interference uses the physical μm value. */
export function bumpDisplayHeightWorld(heightUm: number, availableGapWorld: number): number {
  const height = Math.min(BUMP_HEIGHT_MAX_UM, Math.max(BUMP_HEIGHT_MIN_UM, heightUm))
  const fraction = (height - BUMP_HEIGHT_MIN_UM) / (BUMP_HEIGHT_MAX_UM - BUMP_HEIGHT_MIN_UM)
  const requested = BUMP_DISPLAY_MIN_WORLD + fraction * (BUMP_DISPLAY_MAX_WORLD - BUMP_DISPLAY_MIN_WORLD)
  return Math.min(requested, Math.max(0, availableGapWorld * 0.65))
}
