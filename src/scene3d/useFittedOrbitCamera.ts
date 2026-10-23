import { useCallback, useLayoutEffect, useRef, useState, type ComponentProps, type RefObject } from 'react'
import type { InteractiveCanvas } from './InteractiveCanvas'
import { freeRects } from './freeRects'
import { orbitPosition, type FramingArea, type OrbitView } from './orbitFraming'
import { useOverlayObstacles } from './useOverlayObstacles'
import { useViewportSize } from './useViewportSize'

/** Phones lay panels out below the canvas, so less gutter is needed there. */
const MOBILE_MAX_WIDTH = 767

/**
 * The uncovered areas of the canvas as framing inputs. Overlays are sampled when the scene
 * opens and when `refitKey` changes (a view preset, another apparatus); opening or dragging a
 * panel afterwards only covers the view.
 */
function useFreeAreas(
  ref: RefObject<HTMLDivElement | null>,
  refitKey: string,
): { areas: FramingArea[]; viewportHeight: number } {
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
export function pickLargestView(
  areas: FramingArea[],
  fit: (area: FramingArea) => OrbitView,
  fallback: FramingArea,
): OrbitView {
  let best: OrbitView | null = null
  for (const area of areas) {
    const view = fit(area)
    if (!best || view.radius < best.radius - 1e-6) best = view
  }
  return best ?? fit(fallback)
}

/** Orbit camera limits for an apparatus scene. */
export type OrbitCameraLimits = {
  fov: number
  near: number
  far: number
  minDistance: number
  maxDistance: number
  minPolarAngle: number
  maxPolarAngle: number
}

type CanvasProps = Omit<ComponentProps<typeof InteractiveCanvas>, 'children' | 'frameloop'>

/**
 * The orbit camera for a scene that fits its apparatus bounds: framed in whichever uncovered
 * area shows it largest (beside the panel column for a compact apparatus, below the panels for
 * a long one), held still while a part of the apparatus is being dragged, and returned as
 * ready-made InteractiveCanvas props. `fit` places the camera for one area, usually with
 * fitOrbitView.
 */
export function useFittedOrbitCamera(
  viewportRef: RefObject<HTMLDivElement | null>,
  refitKey: string,
  limits: OrbitCameraLimits,
  fit: (area: FramingArea) => OrbitView,
) {
  const { areas, viewportHeight } = useFreeAreas(viewportRef, refitKey)
  const fitted = pickLargestView(areas, fit, { viewportHeight })
  const fittedRef = useRef(fitted)
  useLayoutEffect(() => {
    fittedRef.current = fitted
  }, [fitted])
  // While a part (a caliper frame, a thimble) is dragged the fitted view may change (bounds follow the reading);
  // keep the camera where it was so the pointer stays on the part it grabbed.
  const [dragView, setDragView] = useState<OrbitView | null>(null)
  const onInstrumentDragChange = useCallback((dragging: boolean) => {
    setDragView(dragging ? fittedRef.current : null)
  }, [])

  const view = dragView ?? fitted
  const maxDistance = Math.max(limits.maxDistance, Math.ceil(view.radius * 1.2))
  const canvasProps: CanvasProps = {
    camera: {
      position: orbitPosition(view),
      fov: limits.fov,
      near: limits.near,
      far: Math.max(limits.far, Math.ceil(maxDistance * 1.5)),
    },
    syncCamera: true,
    screenOffset: view.screenOffset,
    controlsEnabled: dragView === null,
    controls: {
      target: view.target,
      minDistance: limits.minDistance,
      maxDistance,
      minPolarAngle: limits.minPolarAngle,
      maxPolarAngle: limits.maxPolarAngle,
    },
  }
  return { view, canvasProps, onInstrumentDragChange }
}
