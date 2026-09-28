import { useMemo, useRef, useState } from 'react'
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
import { resolvePerformanceProfile } from '../../scene3d/canvasQuality'

export const ELECTROSTATIC_LAB_SCENE_BOUNDS = 7
export const ELECTROSTATIC_LAB_CHARGE_LIMIT = ELECTROSTATIC_LAB_SCENE_BOUNDS - 1
export const ELECTROSTATIC_LAB_MAX_CHARGES = 12

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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function nextChargeId(charges: ReadonlyArray<ElectrostaticCharge>, lastIssuedIndex: number): string {
  let maxIndex = lastIssuedIndex
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
  presetKey: PresetKey | 'custom'
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
  const [presetKey, setPresetKey] = useState<PresetKey | 'custom'>('dipole')
  const [charges, setCharges] = useState<ElectrostaticCharge[]>(() => clonePresetCharges('dipole'))
  const [selectedChargeId, setSelectedChargeId] = useState<string | null>('C1')
  const [displayMode, setDisplayMode] = useState<DisplayMode>('potential')
  const [overlayFieldLines, setOverlayFieldLines] = useState(true)
  const [showContourLines, setShowContourLines] = useState(true)
  const [invertHeight, setInvertHeight] = useState(false)
  const perf = resolvePerformanceProfile()
  const [resolution, setResolution] = useState(() =>
    Math.min(30, perf.electrostaticTerrainResolution),
  )
  const [probeMode, setProbeMode] = useState(false)
  const [probePoint, setProbePoint] = useState<ProbePoint | null>(null)
  const [advancedInteractionsEnabled, setAdvancedInteractionsEnabled] = useState(false)
  const chargeIdCounter = useRef(2)

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

  const reserveNextChargeId = (currentCharges: ReadonlyArray<ElectrostaticCharge>) => {
    const id = nextChargeId(currentCharges, chargeIdCounter.current)
    chargeIdCounter.current = Number(id.slice(1))
    return id
  }

  const addCharge = (magnitude: number) => {
    if (charges.length >= ELECTROSTATIC_LAB_MAX_CHARGES) {
      return
    }

    const id = reserveNextChargeId(charges)
    const idIndex = Number(id.slice(1))
    const angle = idIndex * 2.399963229728653
    const radius = Math.min(ELECTROSTATIC_LAB_CHARGE_LIMIT * 0.82, 2.4 + idIndex * 0.08)
    const nextCharge: ElectrostaticCharge = {
      id,
      x: Number((Math.cos(angle) * radius).toFixed(2)),
      z: Number((Math.sin(angle) * radius).toFixed(2)),
      magnitude,
    }
    setCharges((prevCharges) => [...prevCharges, nextCharge])
    setSelectedChargeId(id)
    setPresetKey('custom')
  }

  const addChargeAtPoint = (position: ProbePoint, sign: 1 | -1) => {
    if (charges.length >= ELECTROSTATIC_LAB_MAX_CHARGES) {
      return
    }

    const id = reserveNextChargeId(charges)
    const nextCharge: ElectrostaticCharge = {
      id,
      x: Number(clamp(position.x, -ELECTROSTATIC_LAB_CHARGE_LIMIT, ELECTROSTATIC_LAB_CHARGE_LIMIT).toFixed(2)),
      z: Number(clamp(position.z, -ELECTROSTATIC_LAB_CHARGE_LIMIT, ELECTROSTATIC_LAB_CHARGE_LIMIT).toFixed(2)),
      magnitude: sign > 0 ? 1.2 : -1.2,
    }
    setCharges((prevCharges) => [...prevCharges, nextCharge])
    setSelectedChargeId(id)
    setPresetKey('custom')
  }

  const deleteChargeById = (chargeId: string) => {
    if (!chargeId) {
      return
    }

    const nextCharges = charges.filter((charge) => charge.id !== chargeId)
    if (nextCharges.length === charges.length) {
      return
    }
    setCharges(nextCharges)
    setPresetKey('custom')
    if (selectedChargeId === chargeId) {
      setSelectedChargeId(nextCharges[0]?.id ?? null)
    }
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

    const normalizedPatch = {
      ...patch,
      ...(patch.x === undefined
        ? {}
        : { x: clamp(patch.x, -ELECTROSTATIC_LAB_CHARGE_LIMIT, ELECTROSTATIC_LAB_CHARGE_LIMIT) }),
      ...(patch.z === undefined
        ? {}
        : { z: clamp(patch.z, -ELECTROSTATIC_LAB_CHARGE_LIMIT, ELECTROSTATIC_LAB_CHARGE_LIMIT) }),
    }
    setCharges((prevCharges) =>
      prevCharges.map((charge) =>
        charge.id === selectedChargeId
          ? {
              ...charge,
              ...normalizedPatch,
            }
          : charge,
      ),
    )
    setPresetKey('custom')
  }

  const setChargePosition = (chargeId: string, position: ProbePoint) => {
    const nextX = clamp(position.x, -ELECTROSTATIC_LAB_CHARGE_LIMIT, ELECTROSTATIC_LAB_CHARGE_LIMIT)
    const nextZ = clamp(position.z, -ELECTROSTATIC_LAB_CHARGE_LIMIT, ELECTROSTATIC_LAB_CHARGE_LIMIT)
    setCharges((prevCharges) =>
      prevCharges.map((charge) =>
        charge.id === chargeId
          ? {
              ...charge,
              x: nextX,
              z: nextZ,
            }
          : charge,
      ),
    )
    setPresetKey('custom')
  }

  const modeLabel = displayMode === 'potential' ? '电势地形' : '电场线'
  const presetLabel = presetKey === 'custom' ? '自定义配置' : PRESET_CONFIGS[presetKey].label

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
