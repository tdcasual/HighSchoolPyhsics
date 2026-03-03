export type ElectrostaticCharge2D = {
  id: string
  x: number
  z: number
  magnitude: number
}

export type ElectrostaticCharge3D = {
  id: string
  x: number
  y: number
  z: number
  magnitude: number
}

export type Vector2 = {
  x: number
  z: number
}

export type Vector3 = {
  x: number
  y: number
  z: number
}

export type PotentialSampleOptions = {
  kScale?: number
  softening?: number
  potentialClamp?: number
}

export type Potential3DSampleOptions = {
  kScale?: number
  softening: number
  nonLinearLimit?: number
}

export type ElectricField2D = {
  ex: number
  ez: number
  magnitude: number
}

export type ElectrostaticPresetKey =
  | 'single'
  | 'dipole'
  | 'same'
  | 'opposite'
  | 'three-linear'
  | 'three-triangle'
  | 'quadrupole'

export type ElectrostaticPresetDefinition = {
  label: string
  charges: ElectrostaticCharge2D[]
}
