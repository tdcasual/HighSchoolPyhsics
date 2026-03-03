import type {
  ElectrostaticCharge2D,
  ElectrostaticCharge3D,
  Potential3DSampleOptions,
  PotentialSampleOptions,
  Vector2,
  Vector3,
} from './types'

const DEFAULT_SOFTENING_2D = 0.24
const DEFAULT_POTENTIAL_CLAMP_2D = 6.5
const DEFAULT_K_SCALE = 1

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function mapPotentialNonLinear(value: number, softPotentialLimit: number): number {
  const safeLimit = Math.max(1e-4, Math.abs(softPotentialLimit))
  if (!Number.isFinite(value)) {
    return 0
  }
  return safeLimit * Math.tanh(value / safeLimit)
}

export function samplePotential2D(
  charges: ReadonlyArray<ElectrostaticCharge2D>,
  point: Vector2,
  options: PotentialSampleOptions = {},
): number {
  const softening = Math.max(1e-3, options.softening ?? DEFAULT_SOFTENING_2D)
  const potentialClamp = Math.max(1e-2, options.potentialClamp ?? DEFAULT_POTENTIAL_CLAMP_2D)
  const kScale = options.kScale ?? DEFAULT_K_SCALE
  const epsilonSquared = softening * softening
  let potential = 0

  for (const charge of charges) {
    const dx = point.x - charge.x
    const dz = point.z - charge.z
    const r = Math.sqrt(dx * dx + dz * dz + epsilonSquared)
    potential += (kScale * charge.magnitude) / r
  }

  return clamp(potential, -potentialClamp, potentialClamp)
}

export function samplePotential3D(
  charges: ReadonlyArray<ElectrostaticCharge3D>,
  point: Vector3,
  options: Potential3DSampleOptions,
): number {
  const softening = Math.max(1e-6, options.softening)
  const kScale = options.kScale ?? DEFAULT_K_SCALE
  const epsilonSquared = softening * softening
  let potential = 0

  for (const charge of charges) {
    const dx = point.x - charge.x
    const dy = point.y - charge.y
    const dz = point.z - charge.z
    potential += (kScale * charge.magnitude) / Math.sqrt(dx * dx + dy * dy + dz * dz + epsilonSquared)
  }

  if (options.nonLinearLimit === undefined) {
    return Number.isFinite(potential) ? potential : 0
  }

  return mapPotentialNonLinear(potential, options.nonLinearLimit)
}
