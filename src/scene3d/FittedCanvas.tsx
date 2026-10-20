import { useRef, type ComponentProps, type PropsWithChildren } from 'react'
import { FitBounds } from './FitBounds'
import { InteractiveCanvas } from './InteractiveCanvas'
import type { Bounds3, Vec3 } from './orbitFraming'
import { boxAround, directionFrom, useAutoFittedCamera, type CameraShot } from './useAutoFittedCamera'
import type { OrbitCameraLimits } from './useFittedOrbitCamera'

type PassThrough = Pick<ComponentProps<typeof InteractiveCanvas>, 'frameloop' | 'cameraUp' | 'presentationFocus' | 'presentationLockMs' | 'controlsEnabled'>

type FittedCanvasProps = PropsWithChildren<
  PassThrough &
    Partial<OrbitCameraLimits> & {
      /**
       * The viewing direction: an orbit shot, or a camera position and the point it looks at
       * (only the direction is used; the distance comes from the apparatus bounds).
       */
      shot: CameraShot | { from: Vec3; to: Vec3; anchor?: Vec3; margin?: number; bounds?: Bounds3 }
      /** Refit when this changes: a view preset, another apparatus. */
      refitKey?: string
      /** Rough extent framed until the apparatus is measured (default: around the anchor). */
      initialBounds?: Bounds3
    }
>

function resolveShot(shot: FittedCanvasProps['shot']): CameraShot {
  if (!('from' in shot)) return shot
  return { ...directionFrom(shot.from, shot.to), anchor: shot.anchor, margin: shot.margin, bounds: shot.bounds }
}

/**
 * InteractiveCanvas framed from the apparatus itself: its children are measured (FitBounds)
 * and fitted from `shot`'s direction into the largest area the panels leave free, on every
 * screen size, with no per-device camera positions. Objects that should not count toward the
 * framing (floor, grid, long field lines) carry `userData={NO_FIT}`.
 */
export function FittedCanvas({ shot, refitKey = '', initialBounds, frameloop, cameraUp, presentationFocus, presentationLockMs, controlsEnabled, children, ...limits }: FittedCanvasProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const resolved = resolveShot(shot)
  const origin = 'from' in shot ? shot.to : resolved.anchor ?? [0, 0, 0]
  const camera = useAutoFittedCamera(viewportRef, refitKey, resolved, {
    ...limits,
    initialBounds: initialBounds ?? boxAround(origin, [2, 2, 2]),
  })
  return (
    <div ref={viewportRef} className="h-full w-full">
      <InteractiveCanvas
        {...camera.canvasProps}
        controlsEnabled={controlsEnabled ?? camera.canvasProps.controlsEnabled}
        frameloop={frameloop}
        cameraUp={cameraUp}
        presentationFocus={presentationFocus}
        presentationLockMs={presentationLockMs}
      >
        <FitBounds {...camera.fitBoundsProps}>{children}</FitBounds>
      </InteractiveCanvas>
    </div>
  )
}
