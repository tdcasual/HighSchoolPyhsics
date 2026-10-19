import type { ScreenRect } from '../../scene3d/useOverlayObstacles'

export type { ScreenRect }

const MIN_WIDTH = 220
const MIN_HEIGHT = 140

function overlaps(a: ScreenRect, b: ScreenRect): boolean {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
}

/**
 * Enumerates the maximal-ish rectangles of the canvas that no overlay covers.
 * Every edge of a candidate is either a canvas edge or an obstacle edge, which is enough
 * to contain each maximal free rectangle for the handful of panels a scene shows.
 */
export function freeRects(input: {
  width: number
  height: number
  obstacles: ScreenRect[]
  /** Gap kept between the instrument area and any panel or canvas edge. */
  gutter: number
}): ScreenRect[] {
  const { width, height, gutter } = input
  const blocks = input.obstacles
    .map((rect) => ({
      left: rect.left - gutter,
      top: rect.top - gutter,
      right: rect.right + gutter,
      bottom: rect.bottom + gutter,
    }))
    .filter((rect) => rect.right > 0 && rect.bottom > 0 && rect.left < width && rect.top < height)
  const lefts = [gutter, ...blocks.map((rect) => rect.right)].filter((x) => x >= gutter && x < width)
  const rights = [width - gutter, ...blocks.map((rect) => rect.left)].filter((x) => x > 0 && x <= width - gutter)
  const tops = [gutter, ...blocks.map((rect) => rect.bottom)].filter((y) => y >= gutter && y < height)
  const bottoms = [height - gutter, ...blocks.map((rect) => rect.top)].filter((y) => y > 0 && y <= height - gutter)

  const found: ScreenRect[] = []
  for (const left of lefts) {
    for (const right of rights) {
      if (right - left < MIN_WIDTH) continue
      for (const top of tops) {
        for (const bottom of bottoms) {
          if (bottom - top < MIN_HEIGHT) continue
          const rect = { left, top, right, bottom }
          if (blocks.some((block) => overlaps(rect, block))) continue
          // Drop rectangles nested inside one already found.
          if (found.some((other) => other.left <= left && other.top <= top && other.right >= right && other.bottom >= bottom)) continue
          found.push(rect)
        }
      }
    }
  }

  return found.length > 0
    ? found
    : [{ left: gutter, top: gutter, right: Math.max(gutter + 1, width - gutter), bottom: Math.max(gutter + 1, height - gutter) }]
}
