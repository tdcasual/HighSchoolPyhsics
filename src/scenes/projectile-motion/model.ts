export const G = 9.8
/** Strobe interval: one dot every 0.1 s, as in the textbook photographs. */
export const STROBE_S = 0.1

export type ProjectileParams = {
  /** Launch speed v₀, m/s. */
  speed: number
  /** Launch angle above the horizontal, degrees (0 = 平抛). */
  angleDeg: number
  /** Launch height above the ground, m. */
  height: number
}

export type ProjectilePoint = { t: number; x: number; y: number; vx: number; vy: number }

export const PRESETS: Record<'horizontal' | 'oblique', ProjectileParams> = {
  horizontal: { speed: 8, angleDeg: 0, height: 5 },
  oblique: { speed: 12, angleDeg: 45, height: 0 },
}

function launchComponents(p: ProjectileParams): { vx0: number; vy0: number } {
  const angle = (p.angleDeg * Math.PI) / 180
  return { vx0: p.speed * Math.cos(angle), vy0: p.speed * Math.sin(angle) }
}

/** Time from launch until y = 0: y = h + vy₀t − ½gt². */
export function flightTime(p: ProjectileParams): number {
  const { vy0 } = launchComponents(p)
  return (vy0 + Math.sqrt(vy0 * vy0 + 2 * G * Math.max(0, p.height))) / G
}

/** Position and velocity at time t (clamped to the landing instant). */
export function pointAt(p: ProjectileParams, t: number): ProjectilePoint {
  const { vx0, vy0 } = launchComponents(p)
  const time = Math.min(Math.max(0, t), flightTime(p))
  return {
    t: time,
    x: vx0 * time,
    y: Math.max(0, p.height + vy0 * time - 0.5 * G * time * time),
    vx: vx0,
    vy: vy0 - G * time,
  }
}

export function range(p: ProjectileParams): number {
  return launchComponents(p).vx0 * flightTime(p)
}

export function maxHeight(p: ProjectileParams): number {
  const { vy0 } = launchComponents(p)
  return Math.max(0, p.height) + (vy0 > 0 ? (vy0 * vy0) / (2 * G) : 0)
}

/** Landing speed and its angle below the horizontal (degrees). */
export function landingVelocity(p: ProjectileParams): { speed: number; angleDeg: number } {
  const end = pointAt(p, flightTime(p))
  return { speed: Math.hypot(end.vx, end.vy), angleDeg: (Math.atan2(-end.vy, end.vx) * 180) / Math.PI }
}

/** Strobe positions at 0, 0.1 s, 0.2 s … up to time t. */
export function strobePoints(p: ProjectileParams, t: number): ProjectilePoint[] {
  const count = Math.floor(Math.min(t, flightTime(p)) / STROBE_S + 1e-9)
  return Array.from({ length: count + 1 }, (_, index) => pointAt(p, index * STROBE_S))
}

/** Region the whole throw occupies (m), used to frame the camera and size the ground marks. */
export function throwExtent(p: ProjectileParams): { width: number; height: number } {
  return { width: Math.max(4, range(p)), height: Math.max(2, maxHeight(p)) }
}

/** Ground mark spacing (1, 2, 5 or 10 m) giving roughly 5–10 marks across the throw. */
export function markSpacing(width: number): number {
  return [1, 2, 5, 10].find((step) => width / step <= 10) ?? 10
}
