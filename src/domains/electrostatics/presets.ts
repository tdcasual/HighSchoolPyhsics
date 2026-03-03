import { cloneCharges2D } from './charges'
import type { ElectrostaticPresetDefinition, ElectrostaticPresetKey } from './types'

export const ELECTROSTATIC_LAB_PRESET_CONFIGS: Record<ElectrostaticPresetKey, ElectrostaticPresetDefinition> = {
  single: {
    label: '单点电荷',
    charges: [{ id: 'C1', x: 0, z: 0, magnitude: 3.2 }],
  },
  dipole: {
    label: '电偶极子',
    charges: [
      { id: 'C1', x: -2.4, z: 0, magnitude: 3.2 },
      { id: 'C2', x: 2.4, z: 0, magnitude: -3.2 },
    ],
  },
  same: {
    label: '等量同号',
    charges: [
      { id: 'C1', x: -2.3, z: 0, magnitude: 2.8 },
      { id: 'C2', x: 2.3, z: 0, magnitude: 2.8 },
    ],
  },
  opposite: {
    label: '等量异号',
    charges: [
      { id: 'C1', x: -3, z: 0, magnitude: 2.8 },
      { id: 'C2', x: 3, z: 0, magnitude: -2.8 },
    ],
  },
  'three-linear': {
    label: '三电荷线性',
    charges: [
      { id: 'C1', x: -3.6, z: 0, magnitude: 2.2 },
      { id: 'C2', x: 0, z: 0, magnitude: -1.3 },
      { id: 'C3', x: 3.6, z: 0, magnitude: 2.2 },
    ],
  },
  'three-triangle': {
    label: '三电荷三角',
    charges: [
      { id: 'C1', x: 0, z: 2.8, magnitude: 2.1 },
      { id: 'C2', x: -2.4, z: -1.4, magnitude: 2.1 },
      { id: 'C3', x: 2.4, z: -1.4, magnitude: 2.1 },
    ],
  },
  quadrupole: {
    label: '电四极子',
    charges: [
      { id: 'C1', x: -2.2, z: -2.2, magnitude: 2.2 },
      { id: 'C2', x: 2.2, z: -2.2, magnitude: -2.2 },
      { id: 'C3', x: -2.2, z: 2.2, magnitude: -2.2 },
      { id: 'C4', x: 2.2, z: 2.2, magnitude: 2.2 },
    ],
  },
}

export function cloneElectrostaticPresetCharges(
  preset: ElectrostaticPresetKey,
  presetConfigs: Record<ElectrostaticPresetKey, ElectrostaticPresetDefinition> = ELECTROSTATIC_LAB_PRESET_CONFIGS,
) {
  return cloneCharges2D(presetConfigs[preset].charges)
}
