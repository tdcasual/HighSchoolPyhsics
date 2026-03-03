import type { NeedlePlacement, OerstedPreset } from './oerstedTypes'

export const SCENE_SCALE = 8
export const WIRE_HALF_LENGTH_M = 0.18
export const EARTH_NORTH_HEADING_DEG = 0

export const DEFAULT_NEEDLE_PLACEMENTS: NeedlePlacement[] = [
  { x: 0.03, z: -0.08 },
  { x: 0.03, z: 0 },
  { x: 0.03, z: 0.08 },
]

export const OERSTED_PRESETS: OerstedPreset[] = [
  {
    id: 'favorable',
    label: '有利摆放',
    tip: '磁针靠近导线中段且初始指北，偏转最明显。',
    currentA: 8,
    earthFieldMicroT: 45,
    wireAzimuthDeg: 0,
    wirePitchDeg: 0,
    wireHeightM: 0.03,
    initialHeadingDeg: 0,
    needlePlacements: [
      { x: 0.03, z: -0.08 },
      { x: 0.03, z: 0 },
      { x: 0.03, z: 0.08 },
    ],
  },
  {
    id: 'unfavorable',
    label: '不利摆放',
    tip: '导线抬高并倾斜，磁针远离中段，摆动显著变小。',
    currentA: 4,
    earthFieldMicroT: 45,
    wireAzimuthDeg: 35,
    wirePitchDeg: 22,
    wireHeightM: 0.13,
    initialHeadingDeg: 0,
    needlePlacements: [
      { x: 0.22, z: -0.12 },
      { x: 0.2, z: 0 },
      { x: 0.22, z: 0.12 },
    ],
  },
  {
    id: 'orientation',
    label: '方向已对齐',
    tip: '即使导线附近磁场不弱，若初始方向接近目标方向，摆动依然不明显。',
    currentA: 7,
    earthFieldMicroT: 45,
    wireAzimuthDeg: 0,
    wirePitchDeg: 0,
    wireHeightM: 0.03,
    initialHeadingDeg: 22,
    needlePlacements: [
      { x: 0.05, z: -0.08 },
      { x: 0.05, z: 0 },
      { x: 0.05, z: 0.08 },
    ],
  },
]
