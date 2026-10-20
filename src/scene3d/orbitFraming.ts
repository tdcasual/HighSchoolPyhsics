/**
 * Orbit-camera framing shared by scenes that compute their own camera from the apparatus
 * bounds (measuring instruments, multimeter, resistivity, celestial motion). Millimetre or
 * scene units alike; nothing here knows about a particular apparatus.
 */
export type Vec3 = [number, number, number]

/** Shared camera presets: 全景 / 正视 / 俯视 / 刻度或特写. */
export type ViewPreset = 'home' | 'front' | 'top' | 'focus'

export type OrbitView = {
  target: Vec3
  azimuth: number
  elevation: number
  radius: number
  /**
   * Screen shift (CSS px, right/down) applied through the projection so the target appears at
   * the center of the free area. Keeping the target on the instrument means zooming converges
   * on it instead of pushing it out toward the canvas edge.
   */
  screenOffset?: [number, number]
}

export function orbitPosition(view: OrbitView): Vec3 {
  const cosine = Math.cos(view.elevation)
  return [
    view.target[0] + view.radius * cosine * Math.sin(view.azimuth),
    view.target[1] + view.radius * Math.sin(view.elevation),
    view.target[2] + view.radius * cosine * Math.cos(view.azimuth),
  ]
}

export type Bounds3 = { min: Vec3; max: Vec3 }

export function bounds(min: Vec3, max: Vec3): Bounds3 {
  return { min, max }
}

export function mergeBounds(...items: Bounds3[]): Bounds3 {
  return {
    min: [
      Math.min(...items.map((item) => item.min[0])),
      Math.min(...items.map((item) => item.min[1])),
      Math.min(...items.map((item) => item.min[2])),
    ],
    max: [
      Math.max(...items.map((item) => item.max[0])),
      Math.max(...items.map((item) => item.max[1])),
      Math.max(...items.map((item) => item.max[2])),
    ],
  }
}

export function boundsCenter(value: Bounds3): Vec3 {
  return [
    (value.min[0] + value.max[0]) / 2,
    (value.min[1] + value.max[1]) / 2,
    (value.min[2] + value.max[2]) / 2,
  ]
}

export function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

/** Returns the perspective distance required to fit every AABB corner into a safe viewport. */
export function fitCameraDistance(input: {
  bounds: Bounds3
  target: Vec3
  azimuth: number
  elevation: number
  fov: number
  aspect: number
  /** Fraction of the canvas height the bounds may occupy (default 1). */
  heightFraction?: number
  margin?: number
  minDistance?: number
}): number {
  const fullTangent = Math.tan((input.fov * Math.PI) / 360)
  const horizontalTangent = fullTangent * Math.max(0.03, input.aspect)
  const verticalTangent = fullTangent * Math.min(1, Math.max(0.05, input.heightFraction ?? 1))
  const sine = Math.sin(input.elevation)
  const cosine = Math.cos(input.elevation)
  const forward: Vec3 = [cosine * Math.sin(input.azimuth), sine, cosine * Math.cos(input.azimuth)]
  const right: Vec3 = [Math.cos(input.azimuth), 0, -Math.sin(input.azimuth)]
  const up: Vec3 = [-sine * Math.sin(input.azimuth), cosine, -sine * Math.cos(input.azimuth)]
  let required = 0

  for (const x of [input.bounds.min[0], input.bounds.max[0]]) {
    for (const y of [input.bounds.min[1], input.bounds.max[1]]) {
      for (const z of [input.bounds.min[2], input.bounds.max[2]]) {
        const relative: Vec3 = [x - input.target[0], y - input.target[1], z - input.target[2]]
        const depth = dot(relative, forward)
        const horizontal = Math.abs(dot(relative, right))
        const vertical = Math.abs(dot(relative, up))
        required = Math.max(
          required,
          depth + horizontal / horizontalTangent,
          depth + vertical / verticalTangent,
        )
      }
    }
  }

  return Math.max(input.minDistance ?? 0, required * (input.margin ?? 1.16))
}

/** Where on the canvas the apparatus should appear: the uncovered area it is fitted into. */
export type FramingArea = {
  /** Width of the area divided by the canvas height. */
  aspect?: number
  /** Height of the area as a fraction of the canvas height (default 1). */
  heightFraction?: number
  /** Shift from the canvas center to the area center, in CSS pixels (right / down). */
  centerOffsetPixels?: number
  centerOffsetYPixels?: number
  /** Canvas height in CSS pixels, to convert world offsets into screen pixels. */
  viewportHeight?: number
}

/**
 * Fits an orbit camera so `bounds` fills `area`, orbiting around `anchor` (default: the bounds
 * center). Zooming dollies toward the anchor, so a scene anchors on what students read (a
 * scale, a needle); the image is shifted back so the whole apparatus stays centered in the area.
 */
export function fitOrbitView(input: FramingArea & {
  bounds: Bounds3
  anchor?: Vec3
  azimuth: number
  elevation: number
  fov: number
  minDistance?: number
  margin?: number
}): OrbitView {
  const { azimuth, elevation } = input
  const center = boundsCenter(input.bounds)
  const radius = fitCameraDistance({
    bounds: input.bounds,
    target: center,
    azimuth,
    elevation,
    fov: input.fov,
    aspect: input.aspect ?? 16 / 9,
    heightFraction: input.heightFraction,
    minDistance: input.minDistance,
    margin: input.margin,
  })
  const anchor = input.anchor ?? center
  const relative: Vec3 = [anchor[0] - center[0], anchor[1] - center[1], anchor[2] - center[2]]
  const cosine = Math.cos(elevation)
  const forward: Vec3 = [cosine * Math.sin(azimuth), Math.sin(elevation), cosine * Math.cos(azimuth)]
  const screenRight: Vec3 = [Math.cos(azimuth), 0, -Math.sin(azimuth)]
  const screenUp: Vec3 = [-Math.sin(elevation) * Math.sin(azimuth), cosine, -Math.sin(elevation) * Math.cos(azimuth)]
  const viewportHeight = Math.max(1, input.viewportHeight ?? 720)
  const pixelsPerWorld = viewportHeight / 2 / Math.tan((input.fov * Math.PI) / 360) / Math.max(1e-6, radius + dot(relative, forward))
  return {
    target: anchor,
    azimuth,
    elevation,
    radius,
    screenOffset: [
      (input.centerOffsetPixels ?? 0) + dot(relative, screenRight) * pixelsPerWorld,
      (input.centerOffsetYPixels ?? 0) - dot(relative, screenUp) * pixelsPerWorld,
    ],
  }
}
