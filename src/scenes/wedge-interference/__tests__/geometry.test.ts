import { describe, expect, it } from 'vitest'
import {
  WEDGE_PLATE_HEIGHT,
  WEDGE_PLATE_WIDTH,
  WEDGE_PLATE_Y,
  WEDGE_PAPER_CENTER_X,
  bumpCenterX,
  bumpDisplayHeightWorld,
  paperSpacerPose,
  upperPlateGroupY,
  visualWedgeAngleDegrees,
  wedgeGapAtX,
} from '../geometry'

describe('wedge geometry mapping', () => {
  it('keeps the thin contact edge touching the lower plate', () => {
    const visualAngle = visualWedgeAngleDegrees(0.0086)
    const groupY = upperPlateGroupY(visualAngle)
    const angle = visualAngle * Math.PI / 180
    const lowerSurfaceAtLeft = groupY - WEDGE_PLATE_WIDTH / 2 * Math.sin(angle) - WEDGE_PLATE_HEIGHT / 2 * Math.cos(angle)
    expect(lowerSurfaceAtLeft).toBeCloseTo(WEDGE_PLATE_Y + WEDGE_PLATE_HEIGHT / 2, 10)
    expect(wedgeGapAtX(visualAngle, -WEDGE_PLATE_WIDTH / 2)).toBe(0)
  })

  it('sizes the spacer to the upper plate gap at its center', () => {
    const visualAngle = visualWedgeAngleDegrees(0.05)
    const spacer = paperSpacerPose(visualAngle)
    expect(spacer.x).toBe(WEDGE_PAPER_CENTER_X)
    expect(spacer.height).toBeCloseTo(wedgeGapAtX(visualAngle, spacer.x), 10)
    expect(spacer.centerY - spacer.height / 2).toBeCloseTo(WEDGE_PLATE_Y + WEDGE_PLATE_HEIGHT / 2, 10)
    expect(spacer.height).toBeGreaterThan(0)
  })

  it('maps bump position to the same plate coordinate used by the fringe texture', () => {
    expect(bumpCenterX(0.1)).toBeCloseTo(-6.4, 10)
    expect(bumpCenterX(0.5)).toBe(0)
    expect(bumpCenterX(0.9)).toBeCloseTo(6.4, 10)
  })

  it('shows a bounded schematic bump that responds to physical height', () => {
    const lower = bumpDisplayHeightWorld(0.5, 1)
    const higher = bumpDisplayHeightWorld(2.5, 1)
    expect(higher).toBeGreaterThan(lower)
    expect(bumpDisplayHeightWorld(3, 0.1)).toBeLessThanOrEqual(0.065)
    expect(bumpDisplayHeightWorld(3, 0)).toBe(0)
  })
})
