import { describe, expect, it } from 'vitest'
import { buildSlitPlateLayout } from '../apparatus'

describe('double-slit apparatus geometry', () => {
  it('creates one centered opening and leaves a complete plate frame for the single slit', () => {
    const layout = buildSlitPlateLayout(1, 0.2, 0.035)
    const verticalBars = layout.bars.filter((bar) => bar.height === layout.apertureHeight)
    const remainingSolidWidth = verticalBars.reduce((sum, bar) => sum + bar.widthZ, 0)

    expect(layout.openingCenters).toEqual([0])
    expect(remainingSolidWidth + layout.apertureWidth).toBeCloseTo(layout.plateWidth, 10)
    expect(verticalBars).toHaveLength(2)
  })

  it('maps the measured slit width and center spacing into matching 3D aperture geometry', () => {
    const layout = buildSlitPlateLayout(2, 0.25, 0.05)
    const solidWidth = layout.bars
      .filter((bar) => bar.height === layout.apertureHeight)
      .reduce((sum, bar) => sum + bar.widthZ, 0)
    const openingSeparation = layout.openingCenters[1] - layout.openingCenters[0]

    expect(openingSeparation).toBeCloseTo(0.5, 10)
    expect(layout.apertureWidth).toBeCloseTo(0.1, 10)
    expect(solidWidth + layout.apertureWidth * 2).toBeCloseTo(layout.plateWidth, 10)
  })

  it('keeps the two openings non-overlapping when slit width reaches slit separation', () => {
    const layout = buildSlitPlateLayout(2, 0.1, 0.1)

    expect(layout.openingCenters).toEqual([-0.1, 0.1])
    expect(layout.bars.every((bar) => bar.widthZ > 0)).toBe(true)
    expect(layout.bars.filter((bar) => bar.height === layout.apertureHeight)).toHaveLength(2)
  })
})
