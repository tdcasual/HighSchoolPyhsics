export type ParticleType = 'proton' | 'deuteron' | 'alpha'

export type ParticleSpec = { label: string; symbol: string; mass: number; charge: number }

export type CyclotronReadings = {
  particle: ParticleSpec
  maxEnergy: number
  energy: number
  accelerationCount: number
  radius: number
  maxRadius: number
  periodRatio: number
  angularFrequency: number
  polarityTop: '-' | '+'
  polarityBottom: '-' | '+'
  inGap: boolean
  extracted: boolean
  progress: number
  particlePosition: [number, number]
  trail: Array<[number, number]>
}

export const PARTICLES: Record<ParticleType, ParticleSpec> = {
  proton: { label: '质子', symbol: '¹₁H', mass: 1, charge: 1 },
  deuteron: { label: '氘核', symbol: '²₁H', mass: 2, charge: 1 },
  alpha: { label: 'α粒子', symbol: '⁴₂He', mass: 4, charge: 2 },
}

export const MAX_CROSSINGS = 36
export const MAX_DEVICE_RADIUS = 230
const ELEMENTARY_CHARGE_C = 1.602176634e-19
const ATOMIC_MASS_UNIT_KG = 1.6605390666e-27
/** Chosen effective radius (2.87948 cm), preserving the teaching scale of 40 keV at 1 T for a proton. */
export const MAX_ENERGY_COEFFICIENT_KEV = 40
export const REFERENCE_DEVICE_RADIUS_M = Math.sqrt(
  MAX_ENERGY_COEFFICIENT_KEV * 2 * ATOMIC_MASS_UNIT_KG * 1000 / ELEMENTARY_CHARGE_C,
)
/** Visual time is normalized; this scale preserves relative qB/m orbit timing. */
const VISUAL_TIME_SCALE = 0.9
const PI = Math.PI

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function getParticleSpec(type: ParticleType): ParticleSpec {
  return PARTICLES[type]
}

export function calculateMaxEnergy(type: ParticleType, field: number): number {
  const particle = getParticleSpec(type)
  return MAX_ENERGY_COEFFICIENT_KEV * particle.charge ** 2 * Math.max(0, field) ** 2 / particle.mass
}

export function calculateEnergy(type: ParticleType, field: number, voltage: number, accelerationCount: number): number {
  const particle = getParticleSpec(type)
  return Math.min(
    calculateMaxEnergy(type, field),
    Math.max(0, accelerationCount) * particle.charge * Math.max(0, voltage),
  )
}

/** Radius in normalized scene units; zero kinetic energy starts at the ion source. */
export function calculateRadius(type: ParticleType, field: number, energy: number): number {
  const maxEnergy = calculateMaxEnergy(type, field)
  if (!(maxEnergy > 0)) return 0
  return MAX_DEVICE_RADIUS * Math.sqrt(clamp(energy / maxEnergy, 0, 1))
}

const VISUAL_DEVICE_RADIUS = 4.55
const VISUAL_EDGE_INSET = 0.18
const ORBIT_SAMPLES = 24
const EXIT_BEAM_LENGTH = 1.8

function getRequiredCrossings(type: ParticleType, B: number, U: number): number {
  const spec = getParticleSpec(type)
  const maxEnergy = calculateMaxEnergy(type, B)
  return Math.min(MAX_CROSSINGS, Math.max(1, Math.ceil(maxEnergy / Math.max(0.1, spec.charge * U))))
}

function buildFullOrbitTrail(type: ParticleType, B: number, U: number, crossings: number): Array<[number, number]> {
  const trail: Array<[number, number]> = [[0, 0]]
  let gapX = 0

  for (let index = 0; index < crossings; index += 1) {
    const energy = calculateEnergy(type, B, U, index + 1)
    const radius = calculateRadius(type, B, energy) / MAX_DEVICE_RADIUS * VISUAL_DEVICE_RADIUS
    const upperDee = index % 2 === 0
    const centerX = upperDee ? gapX - radius : gapX + radius

    for (let sample = 1; sample <= ORBIT_SAMPLES; sample += 1) {
      if (sample === ORBIT_SAMPLES) {
        gapX += upperDee ? -2 * radius : 2 * radius
        trail.push([gapX, 0])
        continue
      }

      const fraction = sample / ORBIT_SAMPLES
      const angle = upperDee ? fraction * PI : PI + fraction * PI
      trail.push([centerX + radius * Math.cos(angle), radius * Math.sin(angle)])
    }
  }

  return trail
}

function getVisualScale(trail: Array<[number, number]>): number {
  const maxDistance = trail.reduce((maximum, [x, y]) => Math.max(maximum, Math.hypot(x, y)), 0)
  return maxDistance > 0
    ? Math.min(1, (VISUAL_DEVICE_RADIUS - VISUAL_EDGE_INSET) / maxDistance)
    : 1
}

export function buildCyclotronTrail(input: {
  type: ParticleType
  B: number
  U: number
  accelerationCount: number
  phase: number
}): {
  trail: Array<[number, number]>
  particlePosition: [number, number]
  progress: number
  inGap: boolean
  extracted: boolean
  radius: number
} {
  const maxCrossings = getRequiredCrossings(input.type, input.B, input.U)
  const crossings = Math.min(input.accelerationCount, maxCrossings)
  const progress = clamp(input.phase, 0, 1)
  const fullTrail = buildFullOrbitTrail(input.type, input.B, input.U, maxCrossings)
  const visualScale = getVisualScale(fullTrail)
  const completedPointIndex = crossings * ORBIT_SAMPLES
  const trail = fullTrail
    .slice(0, completedPointIndex + 1)
    .map(([x, y]) => [x * visualScale, y * visualScale] as [number, number])
  const startX = (fullTrail[completedPointIndex]?.[0] ?? 0) * visualScale
  const energy = calculateEnergy(input.type, input.B, input.U, crossings)
  const physicalRadius = calculateRadius(input.type, input.B, energy)
  const visualRadius = physicalRadius / MAX_DEVICE_RADIUS * VISUAL_DEVICE_RADIUS * visualScale
  const upperDee = crossings % 2 === 0
  const centerX = upperDee ? startX - visualRadius : startX + visualRadius
  const angle = upperDee ? progress * PI : PI + progress * PI
  const position: [number, number] = visualRadius > 0
    ? [centerX + visualRadius * Math.cos(angle), visualRadius * Math.sin(angle)]
    : [startX, 0]
  const extracted = input.accelerationCount >= maxCrossings

  if (extracted) {
    const directionY = maxCrossings % 2 === 1 ? -1 : 1
    const exitPoint = trail[trail.length - 1] ?? [0, 0]
    const particlePosition: [number, number] = [exitPoint[0], exitPoint[1] + directionY * EXIT_BEAM_LENGTH]
    trail.push(particlePosition)
    return {
      trail,
      particlePosition,
      progress: 0,
      inGap: false,
      extracted: true,
      radius: MAX_DEVICE_RADIUS,
    }
  }

  const partialSamples = Math.ceil(progress * ORBIT_SAMPLES)
  for (let sample = 1; sample <= partialSamples; sample += 1) {
    const fraction = progress * sample / partialSamples
    const sampleAngle = upperDee ? fraction * PI : PI + fraction * PI
    trail.push([
      centerX + visualRadius * Math.cos(sampleAngle),
      visualRadius * Math.sin(sampleAngle),
    ])
  }
  const scaledPosition: [number, number] = position

  return {
    trail,
    particlePosition: scaledPosition,
    progress,
    inGap: progress < 0.08 || progress > 0.92,
    extracted: false,
    radius: physicalRadius,
  }
}

export function deriveCyclotronReadings(input: {
  type: ParticleType
  B: number
  U: number
  elapsed: number
  running: boolean
}): CyclotronReadings {
  const spec = getParticleSpec(input.type)
  const maxEnergy = calculateMaxEnergy(input.type, input.B)
  const requiredCrossings = Math.max(1, Math.ceil(maxEnergy / Math.max(0.1, spec.charge * input.U)))
  const maxCrossings = Math.min(MAX_CROSSINGS, requiredCrossings)
  const angularFrequency = spec.charge * Math.max(0, input.B) / spec.mass
  const cycle = Math.max(0, input.elapsed) * angularFrequency / PI * VISUAL_TIME_SCALE
  const accelerationCount = Math.min(maxCrossings, Math.floor(cycle))
  const phase = cycle - Math.floor(cycle)
  const trailData = buildCyclotronTrail({
    type: input.type,
    B: input.B,
    U: input.U,
    accelerationCount,
    phase,
  })
  const energy = calculateEnergy(input.type, input.B, input.U, accelerationCount)
  // The RF field reverses halfway through each semicircle to assist at the next gap crossing.
  const rfHalfCycle = accelerationCount + (phase >= 0.5 ? 1 : 0)
  const topIsNegative = rfHalfCycle % 2 === 0

  return {
    particle: spec,
    maxEnergy,
    energy,
    accelerationCount,
    radius: trailData.radius,
    maxRadius: MAX_DEVICE_RADIUS,
    periodRatio: spec.mass / spec.charge,
    angularFrequency,
    polarityTop: topIsNegative ? '-' : '+',
    polarityBottom: topIsNegative ? '+' : '-',
    inGap: trailData.inGap,
    extracted: trailData.extracted,
    progress: trailData.progress,
    particlePosition: trailData.particlePosition,
    trail: trailData.trail,
  }
}

export function buildEnergyTrace(type: ParticleType, field: number, voltage: number, samples = MAX_CROSSINGS + 1): Array<[number, number]> {
  const count = Math.max(2, Math.floor(samples))
  return Array.from({ length: count }, (_, index) => {
    const crossings = index / (count - 1) * MAX_CROSSINGS
    return [crossings, calculateEnergy(type, field, voltage, crossings)]
  })
}
