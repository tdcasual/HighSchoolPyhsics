export type CollisionKind = 'elastic' | 'inelastic' | 'perfectly-inelastic'

export const RESTITUTION: Record<CollisionKind, number> = {
  elastic: 1,
  inelastic: 0.5,
  'perfectly-inelastic': 0,
}

/** Air track length (m), glider length (m) and starting centres (m). */
export const TRACK_LENGTH = 2
export const GLIDER_LENGTH = 0.2
const START_A = 0.45
const START_B = 1.25

export type CollisionParams = {
  massA: number
  massB: number
  /** Velocities along the track, m/s (positive to the right). */
  velocityA: number
  velocityB: number
  kind: CollisionKind
}

export type CollisionOutcome = {
  /** Whether A catches up with B at all. */
  collides: boolean
  /** Time of contact, s (Infinity if they never meet). */
  contactTime: number
  velocityAAfter: number
  velocityBAfter: number
  momentumBefore: number
  momentumAfter: number
  kineticBefore: number
  kineticAfter: number
}

/** 1-D collision with restitution e: momentum is conserved, relative speed is scaled by e. */
export function collide(p: CollisionParams): CollisionOutcome {
  const e = RESTITUTION[p.kind]
  const total = p.massA + p.massB
  const momentumBefore = p.massA * p.velocityA + p.massB * p.velocityB
  const kineticBefore = 0.5 * p.massA * p.velocityA ** 2 + 0.5 * p.massB * p.velocityB ** 2
  const closing = p.velocityA - p.velocityB
  const gap = START_B - START_A - GLIDER_LENGTH
  if (closing <= 0) {
    return { collides: false, contactTime: Infinity, velocityAAfter: p.velocityA, velocityBAfter: p.velocityB, momentumBefore, momentumAfter: momentumBefore, kineticBefore, kineticAfter: kineticBefore }
  }
  const velocityAAfter = (momentumBefore - p.massB * e * closing) / total
  const velocityBAfter = (momentumBefore + p.massA * e * closing) / total
  return {
    collides: true,
    contactTime: gap / closing,
    velocityAAfter,
    velocityBAfter,
    momentumBefore,
    momentumAfter: p.massA * velocityAAfter + p.massB * velocityBAfter,
    kineticBefore,
    kineticAfter: 0.5 * p.massA * velocityAAfter ** 2 + 0.5 * p.massB * velocityBAfter ** 2,
  }
}

export type GliderState = { t: number; xA: number; xB: number; vA: number; vB: number }

/** Positions and velocities at time t (centres, m). */
export function glidersAt(p: CollisionParams, t: number): GliderState {
  const outcome = collide(p)
  if (t <= outcome.contactTime) {
    return { t, xA: START_A + p.velocityA * t, xB: START_B + p.velocityB * t, vA: p.velocityA, vB: p.velocityB }
  }
  const tc = outcome.contactTime
  const after = t - tc
  return {
    t,
    xA: START_A + p.velocityA * tc + outcome.velocityAAfter * after,
    xB: START_B + p.velocityB * tc + outcome.velocityBAfter * after,
    vA: outcome.velocityAAfter,
    vB: outcome.velocityBAfter,
  }
}

/** The run ends when a glider reaches an end stop. */
export function runEnded(state: GliderState): boolean {
  const half = GLIDER_LENGTH / 2
  return state.xA - half <= 0 || state.xB + half >= TRACK_LENGTH || state.xA + half >= TRACK_LENGTH || state.xB - half <= 0
}

/** When the run ends (a glider hits an end stop), capped at 10 s; used to size the v-t chart. */
export function runDuration(p: CollisionParams): number {
  for (let t = 0; t <= 10; t += 0.01) if (runEnded(glidersAt(p, t))) return t
  return 10
}

export const COLLISION_PRESETS: Record<string, Omit<CollisionParams, 'kind'> & { kind: CollisionKind; label: string }> = {
  swap: { label: '等质量弹性：交换速度', massA: 0.2, massB: 0.2, velocityA: 0.6, velocityB: 0, kind: 'elastic' },
  heavy: { label: '大碰小', massA: 0.4, massB: 0.1, velocityA: 0.5, velocityB: 0, kind: 'elastic' },
  stick: { label: '完全非弹性：粘在一起', massA: 0.2, massB: 0.2, velocityA: 0.6, velocityB: 0, kind: 'perfectly-inelastic' },
}
