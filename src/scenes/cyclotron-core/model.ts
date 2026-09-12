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

const MAX_DEVICE_RADIUS = 230
const BASE_ENERGY_SCALE = 40
const BASE_RADIUS = 18
const MAX_CROSSINGS = 12

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function getParticleSpec(type: ParticleType): ParticleSpec {
  return PARTICLES[type]
}

export function calculateMaxEnergy(type: ParticleType, field: number): number {
  const particle = getParticleSpec(type)
  return BASE_ENERGY_SCALE * particle.charge ** 2 * field ** 2 / particle.mass
}

export function calculateEnergy(type: ParticleType, field: number, voltage: number, accelerationCount: number): number {
  const particle = getParticleSpec(type)
  return Math.min(calculateMaxEnergy(type, field), Math.max(0, accelerationCount) * particle.charge * voltage)
}

export function calculateRadius(type: ParticleType, field: number, energy: number): number {
  const maxEnergy = calculateMaxEnergy(type, field)
  return BASE_RADIUS + (MAX_DEVICE_RADIUS - BASE_RADIUS) * Math.sqrt(clamp(energy / Math.max(0.001, maxEnergy), 0, 1))
}

export function buildCyclotronTrail(input: {
  type: ParticleType
  B: number
  U: number
  accelerationCount: number
  phase: number
}): { trail: Array<[number, number]>; particlePosition: [number, number]; progress: number; inGap: boolean; extracted: boolean; radius: number } {
  const maxEnergy = calculateMaxEnergy(input.type, input.B)
  const spec = getParticleSpec(input.type)
  const requiredCrossings = Math.max(1, Math.ceil(maxEnergy / Math.max(0.1, spec.charge * input.U)))
  const maxCrossings = Math.min(MAX_CROSSINGS, requiredCrossings)
  const crossings = Math.min(input.accelerationCount, maxCrossings)
  const progress = clamp(input.phase, 0, 1)
  const trail: Array<[number, number]> = [[0, 0]]
  for (let index = 0; index < crossings; index += 1) {
    const radius = calculateRadius(input.type, input.B, calculateEnergy(input.type, input.B, input.U, index + 1)) / MAX_DEVICE_RADIUS * 4.55
    const top = index % 2 === 0
    for (let sample = 1; sample <= 24; sample += 1) {
      const t = sample / 24
      const angle = top ? Math.PI - t * Math.PI : -t * Math.PI
      trail.push([radius * Math.cos(angle), radius * Math.sin(angle)])
    }
  }
  const extracted = input.accelerationCount >= maxCrossings
  const currentRadius = calculateRadius(input.type, input.B, calculateEnergy(input.type, input.B, input.U, crossings)) / MAX_DEVICE_RADIUS * 4.55
  if (extracted) {
    const top = crossings % 2 === 0
    const exit: [number, number] = [top ? currentRadius : -currentRadius, 0]
    const direction = top ? 1 : -1
    trail.push([exit[0] + direction * 1.8, exit[1] + direction * 1.1])
    return { trail, particlePosition: trail[trail.length - 1], progress, inGap: false, extracted: true, radius: MAX_DEVICE_RADIUS }
  }
  const top = crossings % 2 === 0
  const angle = top ? Math.PI - progress * Math.PI : -progress * Math.PI
  const position: [number, number] = [currentRadius * Math.cos(angle), currentRadius * Math.sin(angle)]
  trail.push(position)
  return { trail, particlePosition: position, progress, inGap: progress < 0.08 || progress > 0.92, extracted: false, radius: calculateRadius(input.type, input.B, calculateEnergy(input.type, input.B, input.U, crossings)) }
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
  const cycle = input.elapsed * 0.85
  const accelerationCount = Math.min(maxCrossings, Math.floor(cycle))
  const phase = cycle - Math.floor(cycle)
  // `elapsed` is frozen by the scene hook while paused, so retain the exact
  // phase here as well. This keeps the particle visually frozen instead of
  // snapping it to the beginning of the current semicircle.
  const trailData = buildCyclotronTrail({ type: input.type, B: input.B, U: input.U, accelerationCount, phase })
  const energy = calculateEnergy(input.type, input.B, input.U, accelerationCount)
  return {
    particle: spec,
    maxEnergy,
    energy,
    accelerationCount,
    radius: trailData.radius,
    maxRadius: MAX_DEVICE_RADIUS,
    periodRatio: spec.mass / (spec.charge * input.B),
    angularFrequency: spec.charge * input.B / spec.mass,
    polarityTop: accelerationCount % 2 === 0 ? '-' : '+',
    polarityBottom: accelerationCount % 2 === 0 ? '+' : '-',
    inGap: trailData.inGap,
    extracted: trailData.extracted,
    progress: trailData.progress,
    particlePosition: trailData.particlePosition,
    trail: trailData.trail,
  }
}

export function buildEnergyTrace(type: ParticleType, field: number, voltage: number, samples = 9): Array<[number, number]> {
  const count = Math.max(2, Math.floor(samples))
  return Array.from({ length: count }, (_, index) => {
    const crossings = index / (count - 1) * MAX_CROSSINGS
    return [crossings, calculateEnergy(type, field, voltage, crossings)]
  })
}
