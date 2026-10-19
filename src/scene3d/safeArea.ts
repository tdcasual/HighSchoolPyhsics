import type { ScreenRect } from './useOverlayObstacles'

export type SafeAreaTransform = { x: number; y: number; scale: number }

export type SafeAreaOptions = {
  /** Fraction of the canvas width the scene's composition occupies (default 0.8). */
  fill?: number
}

const GUTTER = 20
const MIN_SCALE = 0.6

/**
 * Maps a scene's full-canvas composition into the area right of the sidebar and panel column.
 * The shell stacks every overlay in one column on the left, so the free area is the band from
 * that column's right edge to the canvas edge; the image is shifted to its center and shrunk
 * just enough for `fill` of the original width to fit.
 */
export function resolveSafeAreaTransform(input: {
  width: number
  obstacles: ScreenRect[]
  options?: SafeAreaOptions
}): SafeAreaTransform | null {
  const { width, obstacles } = input
  if (width <= 0) return null
  // Left-anchored overlays only: the gesture hint and anything dragged to the right don't count.
  const column = obstacles.filter((rect) => rect.left < width * 0.4 && rect.right < width * 0.7)
  if (column.length === 0) return null
  const left = Math.max(...column.map((rect) => rect.right)) + GUTTER
  const right = width - GUTTER
  if (right - left < width * 0.3) return null
  const fill = Math.min(1, Math.max(0.3, input.options?.fill ?? 0.8))
  const scale = Math.max(MIN_SCALE, Math.min(1, (right - left) / (width * fill)))
  return { x: (left + right) / 2 - width / 2, y: 0, scale }
}
