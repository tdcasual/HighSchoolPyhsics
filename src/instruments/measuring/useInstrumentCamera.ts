import { useCallback, useLayoutEffect, useRef, useState, type ComponentProps, type RefObject } from 'react'
import type { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { orbitPosition, type FramingArea, type OrbitView } from '../../scene3d/orbitFraming'
import { useBoundsFraming } from '../../scene3d/useBoundsFraming'
import type { cameraLimits } from './pose'

type CanvasProps = Omit<ComponentProps<typeof InteractiveCanvas>, 'children' | 'frameloop'>

/**
 * The orbit camera for an instrument scene: framed in the largest uncovered area (shared
 * useBoundsFraming), held still while the instrument itself is being dragged, and returned as
 * ready-made InteractiveCanvas props.
 */
export function useInstrumentCamera(
  viewportRef: RefObject<HTMLDivElement | null>,
  refitKey: string,
  limits: ReturnType<typeof cameraLimits>,
  fit: (area: FramingArea) => OrbitView,
) {
  const fitted = useBoundsFraming(viewportRef, refitKey, fit)
  const fittedRef = useRef(fitted)
  useLayoutEffect(() => {
    fittedRef.current = fitted
  }, [fitted])
  // While a frame or thimble is dragged the fitted view may change (bounds follow the reading);
  // keep the camera where it was so the pointer stays on the part it grabbed.
  const [dragView, setDragView] = useState<OrbitView | null>(null)
  const onInstrumentDragChange = useCallback((dragging: boolean) => {
    setDragView(dragging ? fittedRef.current : null)
  }, [])

  const view = dragView ?? fitted
  const maxDistance = Math.max(limits.maxDistance, Math.ceil(view.radius * 1.2))
  const canvasProps: CanvasProps = {
    camera: { position: orbitPosition(view), fov: limits.fov, near: limits.near, far: Math.max(limits.far, Math.ceil(maxDistance * 1.5)) },
    adaptiveFraming: false,
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
