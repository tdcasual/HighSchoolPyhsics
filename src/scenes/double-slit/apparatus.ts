export type SlitPlateBar = {
  centerY: number
  centerZ: number
  height: number
  widthZ: number
}

export type SlitPlateLayout = {
  plateWidth: number
  plateHeight: number
  apertureHeight: number
  apertureWidth: number
  openingCenters: number[]
  bars: SlitPlateBar[]
}

const DISPLAY_UNITS_PER_MM = 2
const PLATE_WIDTH = 2.4
const PLATE_HEIGHT = 2.8
const APERTURE_HEIGHT = 2.4

export function buildSlitPlateLayout(
  slitCount: 1 | 2,
  slitDistanceMm: number,
  slitWidthMm: number,
): SlitPlateLayout {
  const apertureWidth = Math.min(0.2, Math.max(0.02, slitWidthMm * DISPLAY_UNITS_PER_MM))
  const separation = Math.max(apertureWidth, Math.min(1, slitDistanceMm * DISPLAY_UNITS_PER_MM))
  const openingCenters = slitCount === 1 ? [0] : [-separation / 2, separation / 2]
  const openingHalfWidth = apertureWidth / 2
  const bars: SlitPlateBar[] = []

  const topBottomHeight = (PLATE_HEIGHT - APERTURE_HEIGHT) / 2
  bars.push({ centerY: -(APERTURE_HEIGHT + topBottomHeight) / 2, centerZ: 0, height: topBottomHeight, widthZ: PLATE_WIDTH })
  bars.push({ centerY: (APERTURE_HEIGHT + topBottomHeight) / 2, centerZ: 0, height: topBottomHeight, widthZ: PLATE_WIDTH })

  let cursor = -PLATE_WIDTH / 2
  for (const centerZ of openingCenters) {
    const openingStart = Math.max(-PLATE_WIDTH / 2, centerZ - openingHalfWidth)
    const openingEnd = Math.min(PLATE_WIDTH / 2, centerZ + openingHalfWidth)
    if (openingStart > cursor) {
      bars.push({
        centerY: 0,
        centerZ: (cursor + openingStart) / 2,
        height: APERTURE_HEIGHT,
        widthZ: openingStart - cursor,
      })
    }
    cursor = Math.max(cursor, openingEnd)
  }
  if (cursor < PLATE_WIDTH / 2) {
    bars.push({
      centerY: 0,
      centerZ: (cursor + PLATE_WIDTH / 2) / 2,
      height: APERTURE_HEIGHT,
      widthZ: PLATE_WIDTH / 2 - cursor,
    })
  }

  return { plateWidth: PLATE_WIDTH, plateHeight: PLATE_HEIGHT, apertureHeight: APERTURE_HEIGHT, apertureWidth, openingCenters, bars }
}
