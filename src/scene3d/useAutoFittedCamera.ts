import { useCallback, useState, type RefObject } from 'react'
import { fitOrbitView, type Bounds3, type OrbitView, type Vec3 } from './orbitFraming'
import { useFittedOrbitCamera, type OrbitCameraLimits } from './useFittedOrbitCamera'

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
