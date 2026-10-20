export const MEDIA = {
  air: { label: '空气', n: 1.0 },
  water: { label: '水', n: 1.33 },
  glass: { label: '玻璃', n: 1.5 },
  diamond: { label: '金刚石', n: 2.42 },
} as const
export type MediumKey = keyof typeof MEDIA

export type RefractionParams = {
  /** Medium the light comes from (top). */
  from: MediumKey
  /** Medium it enters (bottom). */
  to: MediumKey
  /** Angle of incidence from the normal, degrees. */
  incidenceDeg: number
}

export type RefractionResult = {
  n1: number
  n2: number
  /** Refraction angle in degrees, or null under total internal reflection. */
  refractionDeg: number | null
  /** Critical angle in degrees (only from optically denser to rarer media). */
  criticalDeg: number | null
  totalReflection: boolean
  /** Fraction of the light energy reflected (unpolarised Fresnel). */
  reflectance: number
}

const RAD = Math.PI / 180

/** Snell's law n₁·sin i = n₂·sin r, the critical angle sin C = n₂/n₁, and Fresnel reflectance. */
export function refract(p: RefractionParams): RefractionResult {
  const n1 = MEDIA[p.from].n
  const n2 = MEDIA[p.to].n
  const i = p.incidenceDeg * RAD
  const criticalDeg = n1 > n2 ? Math.asin(n2 / n1) / RAD : null
  const sinR = (n1 * Math.sin(i)) / n2
  if (sinR >= 1) {
    return { n1, n2, refractionDeg: null, criticalDeg, totalReflection: true, reflectance: 1 }
  }
  const r = Math.asin(sinR)
  const cosI = Math.cos(i)
  const cosR = Math.cos(r)
  const rs = (n1 * cosI - n2 * cosR) / (n1 * cosI + n2 * cosR)
  const rp = (n2 * cosI - n1 * cosR) / (n2 * cosI + n1 * cosR)
  return { n1, n2, refractionDeg: r / RAD, criticalDeg, totalReflection: false, reflectance: (rs * rs + rp * rp) / 2 }
}
