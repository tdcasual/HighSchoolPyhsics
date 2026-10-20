import type { RefObject } from 'react'
import { freeRects } from './freeRects'
import type { FramingArea, OrbitView } from './orbitFraming'
import { useOverlayObstacles } from './useOverlayObstacles'
import { useViewportSize } from './useViewportSize'

/** Phones lay panels out below the canvas, so less gutter is needed there. */
const MOBILE_MAX_WIDTH = 767

/**
 * The uncovered areas of the canvas as framing inputs. Overlays are sampled when the scene
 * opens and when `refitKey` changes (a view preset, another apparatus); opening or dragging a
 * panel afterwards only covers the view.
 */
export function useFreeAreas(ref: RefObject<HTMLDivElement | null>, refitKey: string): { areas: FramingArea[]; viewportHeight: number } {
  const viewport = useViewportSize(ref)
  const { obstacles } = useOverlayObstacles(ref, refitKey)
  const areas = freeRects({
    width: viewport.width,
    height: viewport.height,
    obstacles,
    gutter: viewport.width <= MOBILE_MAX_WIDTH ? 12 : 20,
  }).map((rect) => ({
    aspect: (rect.right - rect.left) / Math.max(1, viewport.height),
    heightFraction: (rect.bottom - rect.top) / Math.max(1, viewport.height),
    centerOffsetPixels: (rect.left + rect.right) / 2 - viewport.width / 2,
    centerOffsetYPixels: (rect.top + rect.bottom) / 2 - viewport.height / 2,
    viewportHeight: viewport.height,
  }))
  return { areas, viewportHeight: viewport.height }
}

/** The view that shows the apparatus largest: the one with the closest camera. */
export function pickLargestView(areas: FramingArea[], fit: (area: FramingArea) => OrbitView, fallback: FramingArea): OrbitView {
  let best: OrbitView | null = null
  for (const area of areas) {
    const view = fit(area)
    if (!best || view.radius < best.radius - 1e-6) best = view
  }
  return best ?? fit(fallback)
}

/**
 * Frames an apparatus in whichever uncovered area shows it largest: beside the panel column for
 * a compact apparatus, below the panels for a long one. `fit` places the camera for one area
 * (usually via fitOrbitView with the apparatus bounds); pass the result's screenOffset to
 * InteractiveCanvas.
 */
export function useBoundsFraming(ref: RefObject<HTMLDivElement | null>, refitKey: string, fit: (area: FramingArea) => OrbitView): OrbitView {
  const { areas, viewportHeight } = useFreeAreas(ref, refitKey)
  return pickLargestView(areas, fit, { viewportHeight })
}
