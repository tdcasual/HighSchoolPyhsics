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

/** Pixels of pointer travel before a thimble drag commits to turning or sliding. */
const MODE_THRESHOLD_PX = 6

type ActiveAxisDrag = AxisDragPlane & {
  pointerId: number
  /** Thimble drags only: the surface-tangent plane and how it maps to the gap. */
  turn: (AxisDragPlane & { mmPerSurfaceMm: number }) | null
  mode: 'slide' | 'turn' | null
  startClient: [number, number]
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

/**
 * Turning a micrometer thimble: the point under the pointer moves along the surface tangent,
 * and one full circumference advances the spindle by one pitch. `localPoint` is the hit point
 * in the instrument frame, whose x axis is the spindle axis; turning toward a larger reading
 * carries the surface along (0, −cos φ, sin φ) at φ = atan2(y, z) (rotation about +x).
 */
export function thimbleTurn(localPoint: Vector3, pitchMm: number): { tangent: Vector3; mmPerSurfaceMm: number } | null {
  const radius = Math.hypot(localPoint.y, localPoint.z)
  if (radius < 1e-6) return null
  return {
    tangent: new Vector3(0, -localPoint.z / radius, localPoint.y / radius),
    mmPerSurfaceMm: pitchMm / (2 * Math.PI * radius),
  }
}

export function createAxisDragHandlers(options: {
  value: number
  min: number
  max: number
  locked: boolean
  onValueChange: (value: number) => void
  onDraggingChange?: (dragging: boolean) => void
  onLockedAttempt?: () => void
  /**
   * Micrometer thimble: dragging across the axis turns it (the surface follows the pointer,
   * one circumference = one pitch); dragging along the axis still slides it for coarse moves.
   */
  turnPitchMm?: number
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
      let turn: ActiveAxisDrag['turn'] = null
      if (options.turnPitchMm) {
        const local = parent.worldToLocal(event.point.clone())
        const surface = thimbleTurn(local, options.turnPitchMm)
        if (surface) {
          const tangentWorld = parent.localToWorld(local.clone().add(surface.tangent)).sub(event.point)
          const plane = createAxisDragPlane(event.point, cameraDirection, tangentWorld)
          if (plane) turn = { ...plane, mmPerSurfaceMm: surface.mmPerSurfaceMm }
        }
      }
      if (!dragPlane && !turn) return

      event.stopPropagation()
      activeDrags.set(owner, {
        ...(dragPlane ?? turn!),
        turn,
        // Without a turn plane (or a slide plane) the mode is fixed from the start.
        mode: !turn ? 'slide' : !dragPlane ? 'turn' : null,
        startClient: [event.nativeEvent.clientX, event.nativeEvent.clientY],
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
      if (active.mode === null && active.turn) {
        const dx = event.nativeEvent.clientX - active.startClient[0]
        const dy = event.nativeEvent.clientY - active.startClient[1]
        if (Math.hypot(dx, dy) < MODE_THRESHOLD_PX) return
        // Commit to whichever motion the pointer follows more closely.
        const slide = Math.abs(axisDragDelta(event.ray, active) ?? 0) * Math.sqrt(active.projectedAxis.lengthSq())
        const turned = Math.abs(axisDragDelta(event.ray, active.turn) ?? 0) * Math.sqrt(active.turn.projectedAxis.lengthSq())
        active.mode = turned >= slide ? 'turn' : 'slide'
      }
      const delta = active.mode === 'turn' && active.turn
        ? (axisDragDelta(event.ray, active.turn) ?? null)
        : axisDragDelta(event.ray, active)
      if (delta === null) return
      const change = active.mode === 'turn' && active.turn ? delta * active.turn.mmPerSurfaceMm : delta
      options.onValueChange(Math.max(active.min, Math.min(active.max, active.startValue + change)))
    },
    onPointerUp: finish,
    onPointerCancel: finish,
    onLostPointerCapture: finish,
  }
}
