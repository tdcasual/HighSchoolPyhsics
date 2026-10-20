import { recall, useRemember } from '../../app/sceneMemory/sceneMemory'
import { useMemo, useState } from 'react'
import { buildEquipotentialSurfaces, type EquipotentialCharge } from './model'
import { resolvePerformanceProfile } from '../../scene3d/canvasQuality'

export const SCENE_BOUNDS = 5
const SOFTENING_EPSILON = 0.18

function createCharge(id: string, x: number, y: number, z: number, magnitude: number): EquipotentialCharge {
  return { id, x, y, z, magnitude }
}

function createDipolePreset(): EquipotentialCharge[] {
  return [
    createCharge('C1', -2.2, 0, 0, 12),
    createCharge('C2', 2.2, 0, 0, -12),
  ]
}

function createQuadrupolePreset(): EquipotentialCharge[] {
  return [
    createCharge('C1', -2.2, 0, -2.2, 10),
    createCharge('C2', 2.2, 0, -2.2, -10),
    createCharge('C3', -2.2, 0, 2.2, -10),
    createCharge('C4', 2.2, 0, 2.2, 10),
  ]
}

function nextChargeId(charges: ReadonlyArray<EquipotentialCharge>): string {
  let maxIndex = 0
  for (const charge of charges) {
    const match = charge.id.match(/^C(\d+)$/)
    if (!match) {
      continue
    }
    maxIndex = Math.max(maxIndex, Number(match[1]))
  }
  return `C${maxIndex + 1}`
}

/** Charges, presets, sampling and the computed equipotential shells for the 等势面 scene. */
export function useEquipotentialSceneState() {
  const [charges, setCharges] = useState<EquipotentialCharge[]>(() => recall('equipotential.charges', () => createDipolePreset()))
  const [selectedChargeId, setSelectedChargeId] = useState<string | null>('C1')
  const [shellCount, setShellCount] = useState(() => recall('equipotential.shellCount', 4))
  const [sampleResolution, setSampleResolution] = useState(() => recall('equipotential.sampleResolution', 20))
  const [activePreset, setActivePreset] = useState<'dipole' | 'quadrupole' | 'custom'>(() => recall('equipotential.activePreset', 'dipole'))
  useRemember('equipotential', { charges, shellCount, sampleResolution, activePreset })
  const maxCharges = 12

  const selectedCharge = useMemo(
    () => charges.find((charge) => charge.id === selectedChargeId) ?? null,
    [charges, selectedChargeId],
  )

  const perf = resolvePerformanceProfile()
  const maxSampleResolution = Math.max(14, Math.min(26, Math.round(14 + 12 * Math.sqrt(perf.equipotentialMaxPointsPerSurface / 1200))))
  const effectiveResolution = Math.min(sampleResolution, maxSampleResolution)

  const cloudResult = useMemo(
    () =>
      buildEquipotentialSurfaces({
        charges,
        bounds: SCENE_BOUNDS,
        resolution: effectiveResolution,
        shellCount,
        softeningEpsilon: SOFTENING_EPSILON,
      }),
    [charges, effectiveResolution, shellCount],
  )

  const addCharge = (magnitude: number) => {
    if (charges.length >= maxCharges) {
      return
    }
    const id = nextChargeId(charges)
    const chargeIndex = Number(id.slice(1)) - 1
    const theta = ((chargeIndex % 8) * Math.PI) / 4
    const radius = Math.min(2.8 + Math.floor(chargeIndex / 8) * 0.2, 3)
    const newCharge = createCharge(
      id,
      Number((Math.cos(theta) * radius).toFixed(1)),
      0,
      Number((Math.sin(theta) * radius).toFixed(1)),
      magnitude,
    )
    setCharges([...charges, newCharge])
    setSelectedChargeId(newCharge.id)
    setActivePreset('custom')
  }

  const updateSelectedCharge = (
    patch: Partial<Pick<EquipotentialCharge, 'x' | 'y' | 'z' | 'magnitude'>>,
  ) => {
    if (!selectedChargeId) {
      return
    }

    setCharges(
      charges.map((charge) =>
        charge.id === selectedChargeId
          ? {
              ...charge,
              ...patch,
            }
          : charge,
      ),
    )
    setActivePreset('custom')
  }

  const deleteSelectedCharge = () => {
    if (!selectedChargeId) {
      return
    }

    const nextCharges = charges.filter((charge) => charge.id !== selectedChargeId)
    setCharges(nextCharges)
    setSelectedChargeId(nextCharges[0]?.id ?? null)
    setActivePreset('custom')
  }

  const applyPreset = (presetName: 'dipole' | 'quadrupole') => {
    const nextCharges = presetName === 'quadrupole' ? createQuadrupolePreset() : createDipolePreset()
    setCharges(nextCharges)
    setSelectedChargeId(nextCharges[0]?.id ?? null)
    setActivePreset(presetName)
  }

  return {
    charges,
    selectedChargeId,
    setSelectedChargeId,
    selectedCharge,
    shellCount,
    setShellCount,
    effectiveResolution,
    maxSampleResolution,
    setSampleResolution,
    activePreset,
    setActivePreset,
    maxCharges,
    cloudResult,
    addCharge,
    updateSelectedCharge,
    deleteSelectedCharge,
    applyPreset,
  }
}

export type EquipotentialSceneState = ReturnType<typeof useEquipotentialSceneState>
