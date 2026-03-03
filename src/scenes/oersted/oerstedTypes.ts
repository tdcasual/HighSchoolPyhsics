export type NeedlePlacement = {
  x: number
  z: number
}

export type NeedleVisual = {
  x: number
  z: number
  headingDeg: number
  targetHeadingDeg: number
}

export type OerstedPresetId = 'favorable' | 'unfavorable' | 'orientation'

export type OerstedPreset = {
  id: OerstedPresetId
  label: string
  tip: string
  currentA: number
  earthFieldMicroT: number
  wireAzimuthDeg: number
  wirePitchDeg: number
  wireHeightM: number
  initialHeadingDeg: number
  needlePlacements: NeedlePlacement[]
}
