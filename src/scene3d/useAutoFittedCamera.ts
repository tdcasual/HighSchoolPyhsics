import { useCallback, useState, type RefObject } from 'react'
import { bounds as makeBounds, fitOrbitView, type Bounds3, type OrbitView, type Vec3 } from './orbitFraming'
import { useFittedOrbitCamera, type OrbitCameraLimits } from './useFittedOrbitCamera'

/** The orbit direction (radians) of a camera at `position` looking at `target`. */
export function directionFrom(position: Vec3, target: Vec3): { azimuth: number; elevation: number } {
  const dx = position[0] - target[0]
  const dy = position[1] - target[1]
  const dz = position[2] - target[2]
  return { azimuth: Math.atan2(dx, dz), elevation: Math.atan2(dy, Math.hypot(dx, dz)) }
}

export type CameraShot = {
  azimuth: number
  elevation: number
  /** Orbit and zoom around this point instead of the bounds centre (what students read). */
  anchor?: Vec3
  /** Extra room around the apparatus (default 1.16). */
  margin?: number
  /** Bounds to use instead of measuring: a view of one part, or a known extent. */
  bounds?: Bounds3
}

const DEFAULT_LIMITS: OrbitCameraLimits = {
  fov: 42,
  near: 0.1,
  far: 200,
  minDistance: 1,
  maxDistance: 60,
  minPolarAngle: 0,
  maxPolarAngle: Math.PI,
}

/**
 * The camera for a scene that wants its apparatus centred and as large as the uncovered area
 * allows, without hand-measured bounds: wrap the apparatus in <FitBounds {...fitBoundsProps}>,
 * spread canvasProps on InteractiveCanvas and give the viewing direction as `shot`. Until the
 * first measurement it frames `initialBounds` (a rough extent, so the first frame is close).
 */
export function useAutoFittedCamera(
  viewportRef: RefObject<HTMLDivElement | null>,
  refitKey: string,
  shot: CameraShot,
  options: Partial<OrbitCameraLimits> & { initialBounds: Bounds3 },
) {
  const limits = { ...DEFAULT_LIMITS, ...options }
  const [measured, setMeasured] = useState<Bounds3 | null>(null)
  const onBounds = useCallback((next: Bounds3) => setMeasured(next), [])
  const fitBounds = shot.bounds ?? measured ?? options.initialBounds
  const camera = useFittedOrbitCamera(
    viewportRef,
    refitKey,
    limits,
    (area): OrbitView =>
      fitOrbitView({
        ...area,
        bounds: fitBounds,
        anchor: shot.anchor,
        azimuth: shot.azimuth,
        elevation: shot.elevation,
        fov: limits.fov,
        minDistance: limits.minDistance,
        margin: shot.margin,
      }),
  )
  return { ...camera, fitBoundsProps: { refitKey, onBounds } }
}

/** Bounds of a box centred on `center` with half-sizes `half` (a rough initial extent). */
export function boxAround(center: Vec3, half: Vec3): Bounds3 {
  return makeBounds(
    [center[0] - half[0], center[1] - half[1], center[2] - half[2]],
    [center[0] + half[0], center[1] + half[1], center[2] + half[2]],
  )
}
