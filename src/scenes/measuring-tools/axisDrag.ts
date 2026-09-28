import type { ThreeEvent } from '@react-three/fiber'
import { Plane, Ray, Vector3, type Object3D } from 'three'

const MIN_PROJECTED_AXIS_SQUARED = 0.04

export type AxisDragPlane = {
  plane: Plane
  anchor: Vector3
  projectedAxis: Vector3
}

type PointerCaptureTarget = EventTarget & {
  setPointerCapture?: (pointerId: number) => void
  releasePointerCapture?: (pointerId: number) => void
}

type ActiveAxisDrag = AxisDragPlane & {
  pointerId: number
  startValue: number
  min: number
  max: number
  target: PointerCaptureTarget | null
  onValueChange: (value: number) => void
  onDraggingChange?: (dragging: boolean) => void
}

const activeDrags = new WeakMap<Object3D, ActiveAxisDrag>()

/**
 * Builds a camera-facing drag plane and the instrument axis projected onto it.
 * Scene units are millimetres, so the returned pointer delta is a millimetre delta.
 */
export function createAxisDragPlane(anchor: Vector3, cameraDirection: Vector3, worldAxis: Vector3): AxisDragPlane | null {
  const normal = cameraDirection.clone().normalize()
  const axis = worldAxis.clone().normalize()
  const projectedAxis = axis.addScaledVector(normal, -axis.dot(normal))
  if (projectedAxis.lengthSq() < MIN_PROJECTED_AXIS_SQUARED) return null

  return {
    plane: new Plane().setFromNormalAndCoplanarPoint(normal, anchor),
    anchor: anchor.clone(),
    projectedAxis,
  }
}

export function axisDragDelta(ray: Ray, drag: AxisDragPlane): number | null {
  const point = ray.intersectPlane(drag.plane, new Vector3())
  if (!point) return null
  return point.sub(drag.anchor).dot(drag.projectedAxis) / drag.projectedAxis.lengthSq()
}

export function createAxisDragHandlers(options: {
  value: number
  min: number
  max: number
  locked: boolean
  onValueChange: (value: number) => void
  onDraggingChange?: (dragging: boolean) => void
  onLockedAttempt?: () => void
}) {
  const finish = (event: ThreeEvent<PointerEvent>) => {
    const active = activeDrags.get(event.eventObject)
    if (!active || active.pointerId !== event.pointerId) return

    event.stopPropagation()
    activeDrags.delete(event.eventObject)
    try {
      active.target?.releasePointerCapture?.(event.pointerId)
    } catch {
      // The pointer may already have been released by the browser.
    }
    active.onDraggingChange?.(false)
  }

  return {
    onPointerDown: (event: ThreeEvent<PointerEvent>) => {
      const owner = event.eventObject
      if (activeDrags.has(owner)) return
      if (options.locked) {
        event.stopPropagation()
        options.onLockedAttempt?.()
        return
      }

      const parent = owner.parent
      if (!parent) return
      parent.updateWorldMatrix(true, false)
      const origin = parent.localToWorld(new Vector3())
      const endpoint = parent.localToWorld(new Vector3(1, 0, 0))
      const worldAxis = endpoint.sub(origin)
      if (worldAxis.lengthSq() < 1e-9) return

      const cameraDirection = event.camera.getWorldDirection(new Vector3()).normalize()
      const dragPlane = createAxisDragPlane(event.point, cameraDirection, worldAxis)
      if (!dragPlane) return

      event.stopPropagation()
      activeDrags.set(owner, {
        ...dragPlane,
        pointerId: event.pointerId,
        startValue: options.value,
        min: options.min,
        max: options.max,
        target: event.target as PointerCaptureTarget | null,
        onValueChange: options.onValueChange,
        onDraggingChange: options.onDraggingChange,
      })
      try {
        ;(event.target as PointerCaptureTarget | null)?.setPointerCapture?.(event.pointerId)
      } catch {
        // Pointer capture is not available in every browser input mode.
      }
      options.onDraggingChange?.(true)
    },
    onPointerMove: (event: ThreeEvent<PointerEvent>) => {
      const active = activeDrags.get(event.eventObject)
      if (!active || active.pointerId !== event.pointerId) return

      event.stopPropagation()
      const delta = axisDragDelta(event.ray, active)
      if (delta === null) return
      options.onValueChange(Math.max(active.min, Math.min(active.max, active.startValue + delta)))
    },
    onPointerUp: finish,
    onPointerCancel: finish,
    onLostPointerCapture: finish,
  }
}
