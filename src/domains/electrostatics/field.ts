import type { ElectricField2D, ElectrostaticCharge2D, PotentialSampleOptions, Vector2 } from './types'

const DEFAULT_SOFTENING_2D = 0.24
const DEFAULT_K_SCALE = 1

type FieldSampleOptions = Pick<PotentialSampleOptions, 'softening' | 'kScale'>

export function sampleElectricField2D(
  charges: ReadonlyArray<ElectrostaticCharge2D>,
  point: Vector2,
  options: FieldSampleOptions = {},
): ElectricField2D {
  const softening = Math.max(1e-3, options.softening ?? DEFAULT_SOFTENING_2D)
  const kScale = options.kScale ?? DEFAULT_K_SCALE
  const epsilonSquared = softening * softening
  let ex = 0
  let ez = 0

  for (const charge of charges) {
    const dx = point.x - charge.x
    const dz = point.z - charge.z
    const rSquared = dx * dx + dz * dz + epsilonSquared
    const r = Math.sqrt(rSquared)
    const factor = (kScale * charge.magnitude) / (rSquared * r)
    ex += factor * dx
    ez += factor * dz
  }

  return { ex, ez, magnitude: Math.hypot(ex, ez) }
}
