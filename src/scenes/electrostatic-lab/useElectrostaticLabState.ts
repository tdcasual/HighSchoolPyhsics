import { useMemo, useState } from 'react'
import {
  buildFieldLines,
  buildPotentialTerrain,
  clonePresetCharges,
  PRESET_CONFIGS,
  sampleElectricFieldAt,
  samplePotentialAt,
  summarizeChargeSet,
  type ElectrostaticCharge,
  type PresetKey,
} from './model'

export const ELECTROSTATIC_LAB_SCENE_BOUNDS = 7

type ProbePoint = {
  x: number
  z: number
}

type DisplayMode = 'potential' | 'field'

type ProbeReadout = {
  potential: number
  field: {
    ex: number
    ez: number
    magnitude: number
  }
}

function nextChargeId(charges: ReadonlyArray<ElectrostaticCharge>): string {
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

export type ElectrostaticLabState = {
  presetKey: PresetKey
  presetLabel: string
  charges: ElectrostaticCharge[]
  selectedChargeId: string | null
  selectedCharge: ElectrostaticCharge | null
  displayMode: DisplayMode
  modeLabel: string
  overlayFieldLines: boolean
  showContourLines: boolean
  invertHeight: boolean
  resolution: number
  probeMode: boolean
  probePoint: ProbePoint | null
  advancedInteractionsEnabled: boolean
  chargeSummary: ReturnType<typeof summarizeChargeSet>
  terrain: ReturnType<typeof buildPotentialTerrain>
  fieldLines: ReturnType<typeof buildFieldLines>
  probeReadout: ProbeReadout | null
  applyPreset: (nextPreset: PresetKey) => void
  setDisplayMode: (mode: DisplayMode) => void
  setOverlayFieldLines: (enabled: boolean) => void
  setShowContourLines: (enabled: boolean) => void
  setInvertHeight: (enabled: boolean) => void
  toggleAdvancedInteractions: () => void
  addPositiveCharge: () => void
  addNegativeCharge: () => void
  deleteSelectedCharge: () => void
  toggleProbeMode: () => void
  selectCharge: (chargeId: string | null) => void
  updateSelectedCharge: (patch: Partial<Pick<ElectrostaticCharge, 'x' | 'z' | 'magnitude'>>) => void
  setResolution: (value: number) => void
  setProbePoint: (point: ProbePoint) => void
  setChargePosition: (chargeId: string, position: ProbePoint) => void
  addChargeAtPoint: (position: ProbePoint, sign: 1 | -1) => void
  deleteChargeById: (chargeId: string) => void
}

export function useElectrostaticLabState(): ElectrostaticLabState {
  const [presetKey, setPresetKey] = useState<PresetKey>('dipole')
  const [charges, setCharges] = useState<ElectrostaticCharge[]>(() => clonePresetCharges('dipole'))
  const [selectedChargeId, setSelectedChargeId] = useState<string | null>('C1')
  const [displayMode, setDisplayMode] = useState<DisplayMode>('potential')
  const [overlayFieldLines, setOverlayFieldLines] = useState(true)
  const [showContourLines, setShowContourLines] = useState(true)
  const [invertHeight, setInvertHeight] = useState(false)
  const [resolution, setResolution] = useState(30)
  const [probeMode, setProbeMode] = useState(false)
  const [probePoint, setProbePoint] = useState<ProbePoint | null>(null)
  const [advancedInteractionsEnabled, setAdvancedInteractionsEnabled] = useState(false)

  const selectedCharge = useMemo(
    () => charges.find((charge) => charge.id === selectedChargeId) ?? null,
    [charges, selectedChargeId],
  )

  const chargeSummary = useMemo(() => summarizeChargeSet(charges), [charges])

  const terrain = useMemo(
    () =>
      buildPotentialTerrain({
        charges,
        bounds: ELECTROSTATIC_LAB_SCENE_BOUNDS,
        resolution,
        contourLevels: [-3, -2, -1, 0, 1, 2, 3],
        invertHeight,
      }),
    [charges, invertHeight, resolution],
  )

  const fieldLines = useMemo(
    () =>
      buildFieldLines({
        charges,
        bounds: ELECTROSTATIC_LAB_SCENE_BOUNDS,
        seedsPerCharge: displayMode === 'field' ? 11 : 8,
        maxSteps: displayMode === 'field' ? 220 : 170,
      }),
    [charges, displayMode],
  )

  const probeReadout = useMemo<ProbeReadout | null>(() => {
    if (!probePoint) {
      return null
    }
    const potential = samplePotentialAt(charges, probePoint)
    const field = sampleElectricFieldAt(charges, probePoint)
    return { potential, field }
  }, [charges, probePoint])

  const applyPreset = (nextPreset: PresetKey) => {
    const nextCharges = clonePresetCharges(nextPreset)
    setPresetKey(nextPreset)
    setCharges(nextCharges)
    setSelectedChargeId(nextCharges[0]?.id ?? null)
    setProbePoint(null)
  }

  const addCharge = (magnitude: number) => {
    setCharges((prevCharges) => {
      const id = nextChargeId(prevCharges)
      const angle = prevCharges.length * 0.85
      const radius = 3.8
      const nextCharge: ElectrostaticCharge = {
        id,
        x: Number((Math.cos(angle) * radius).toFixed(1)),
        z: Number((Math.sin(angle) * radius).toFixed(1)),
        magnitude,
      }
      setSelectedChargeId(id)
      return [...prevCharges, nextCharge]
    })
  }

  const addChargeAtPoint = (position: ProbePoint, sign: 1 | -1) => {
    setCharges((prevCharges) => {
      const id = nextChargeId(prevCharges)
      const nextCharge: ElectrostaticCharge = {
        id,
        x: Number(position.x.toFixed(2)),
        z: Number(position.z.toFixed(2)),
        magnitude: sign > 0 ? 1.2 : -1.2,
      }
      setSelectedChargeId(id)
      return [...prevCharges, nextCharge]
    })
  }

  const deleteChargeById = (chargeId: string) => {
    if (!chargeId) {
      return
    }

    setCharges((prevCharges) => {
      const nextCharges = prevCharges.filter((charge) => charge.id !== chargeId)
      if (selectedChargeId === chargeId) {
        setSelectedChargeId(nextCharges[0]?.id ?? null)
      }
      return nextCharges
    })
  }

  const deleteSelectedCharge = () => {
    if (!selectedChargeId) {
      return
    }
    deleteChargeById(selectedChargeId)
  }

  const updateSelectedCharge = (
    patch: Partial<Pick<ElectrostaticCharge, 'x' | 'z' | 'magnitude'>>,
  ) => {
    if (!selectedChargeId) {
      return
    }

    setCharges((prevCharges) =>
      prevCharges.map((charge) =>
        charge.id === selectedChargeId
          ? {
              ...charge,
              ...patch,
            }
          : charge,
      ),
    )
  }

  const setChargePosition = (chargeId: string, position: ProbePoint) => {
    setCharges((prevCharges) =>
      prevCharges.map((charge) =>
        charge.id === chargeId
          ? {
              ...charge,
              x: position.x,
              z: position.z,
            }
          : charge,
      ),
    )
  }

  const modeLabel = displayMode === 'potential' ? '电势地形' : '电场线'
  const presetLabel = PRESET_CONFIGS[presetKey].label

  return {
    presetKey,
    presetLabel,
    charges,
    selectedChargeId,
    selectedCharge,
    displayMode,
    modeLabel,
    overlayFieldLines,
    showContourLines,
    invertHeight,
    resolution,
    probeMode,
    probePoint,
    advancedInteractionsEnabled,
    chargeSummary,
    terrain,
    fieldLines,
    probeReadout,
    applyPreset,
    setDisplayMode,
    setOverlayFieldLines,
    setShowContourLines,
    setInvertHeight,
    toggleAdvancedInteractions: () => setAdvancedInteractionsEnabled((value) => !value),
    addPositiveCharge: () => addCharge(2.4),
    addNegativeCharge: () => addCharge(-2.4),
    deleteSelectedCharge,
    toggleProbeMode: () => setProbeMode((value) => !value),
    selectCharge: setSelectedChargeId,
    updateSelectedCharge,
    setResolution: (value: number) => setResolution(Math.round(value)),
    setProbePoint,
    setChargePosition,
    addChargeAtPoint,
    deleteChargeById,
  }
}
