import { useEffect, useMemo, useState } from 'react'
import {
  deriveOerstedNeedleState,
  describeDiscoveryLevel,
  stepNeedleHeading,
} from './model'
import {
  DEFAULT_NEEDLE_PLACEMENTS,
  EARTH_NORTH_HEADING_DEG,
  OERSTED_PRESETS,
  WIRE_HALF_LENGTH_M,
} from './oerstedPresets'
import type { NeedlePlacement, NeedleVisual, OerstedPreset, OerstedPresetId } from './oerstedTypes'
import { normalize, type Vec3 } from './vectorMath'

function toRadians(valueDeg: number): number {
  return (valueDeg * Math.PI) / 180
}

function wrapPhase(value: number): number {
  const wrapped = value % 1
  return wrapped < 0 ? wrapped + 1 : wrapped
}

function directionFromAngles(azimuthDeg: number, pitchDeg: number): Vec3 {
  const azimuth = toRadians(azimuthDeg)
  const pitch = toRadians(pitchDeg)
  const horizontal = Math.cos(pitch)
  return normalize({
    x: Math.sin(azimuth) * horizontal,
    y: Math.sin(pitch),
    z: Math.cos(azimuth) * horizontal,
  })
}

function cloneNeedlePlacements(placements: NeedlePlacement[]): NeedlePlacement[] {
  return placements.map((placement) => ({ ...placement }))
}

type NeedlePreviewState = ReturnType<typeof deriveOerstedNeedleState>

type UseOerstedSceneStateResult = {
  currentA: number
  earthFieldMicroT: number
  wireAzimuthDeg: number
  wirePitchDeg: number
  wireHeightM: number
  initialHeadingDeg: number
  running: boolean
  phase: number
  showFieldLines: boolean
  activePresetId: OerstedPresetId | 'custom'
  activePresetTip: string
  wireDirection: Vec3
  previewNeedleStates: NeedlePreviewState[]
  visualNeedles: NeedleVisual[]
  maxSwing: number
  discoveryText: string
  draggingNeedleIndex: number | null
  applyPreset: (preset: OerstedPreset) => void
  onCurrentChange: (value: number) => void
  onEarthFieldChange: (value: number) => void
  onWireAzimuthChange: (value: number) => void
  onWirePitchChange: (value: number) => void
  onWireHeightChange: (value: number) => void
  onInitialHeadingChange: (value: number) => void
  toggleRunning: () => void
  resetNeedles: () => void
  toggleFieldLines: () => void
  setNeedlePlacementByDrag: (index: number, placement: NeedlePlacement) => void
  startNeedleDrag: (index: number) => void
  endNeedleDrag: () => void
}

export function useOerstedSceneState(): UseOerstedSceneStateResult {
  const [currentA, setCurrentA] = useState(4)
  const [earthFieldMicroT, setEarthFieldMicroT] = useState(45)
  const [wireAzimuthDeg, setWireAzimuthDeg] = useState(0)
  const [wirePitchDeg, setWirePitchDeg] = useState(0)
  const [wireHeightM, setWireHeightM] = useState(0.03)
  const [initialHeadingDeg, setInitialHeadingDeg] = useState(EARTH_NORTH_HEADING_DEG)
  const [needlePlacements, setNeedlePlacements] = useState<NeedlePlacement[]>(DEFAULT_NEEDLE_PLACEMENTS)
  const [needleHeadingsDeg, setNeedleHeadingsDeg] = useState<number[]>(
    DEFAULT_NEEDLE_PLACEMENTS.map(() => EARTH_NORTH_HEADING_DEG),
  )
  const [running, setRunning] = useState(false)
  const [phase, setPhase] = useState(0)
  const [showFieldLines, setShowFieldLines] = useState(true)
  const [activePresetId, setActivePresetId] = useState<OerstedPresetId | 'custom'>('custom')
  const [draggingNeedleIndex, setDraggingNeedleIndex] = useState<number | null>(null)

  const wireDirection = useMemo(
    () => directionFromAngles(wireAzimuthDeg, wirePitchDeg),
    [wireAzimuthDeg, wirePitchDeg],
  )

  const previewNeedleStates = useMemo(
    () =>
      needlePlacements.map((needle) =>
        deriveOerstedNeedleState({
          currentA,
          needlePositionM: { x: needle.x, z: needle.z },
          initialHeadingDeg,
          earthFieldMicroT,
          wireHeightM,
          wireHalfLengthM: WIRE_HALF_LENGTH_M,
          wireDirection,
        }),
      ),
    [currentA, earthFieldMicroT, initialHeadingDeg, needlePlacements, wireDirection, wireHeightM],
  )

  const activeNeedleStates = useMemo(
    () =>
      needlePlacements.map((needle) =>
        deriveOerstedNeedleState({
          currentA: running ? currentA : 0,
          needlePositionM: { x: needle.x, z: needle.z },
          initialHeadingDeg,
          earthFieldMicroT,
          wireHeightM,
          wireHalfLengthM: WIRE_HALF_LENGTH_M,
          wireDirection,
        }),
      ),
    [currentA, earthFieldMicroT, initialHeadingDeg, needlePlacements, running, wireDirection, wireHeightM],
  )

  const visualNeedles = useMemo<NeedleVisual[]>(
    () =>
      needlePlacements.map((needle, index) => ({
        x: needle.x,
        z: needle.z,
        headingDeg: needleHeadingsDeg[index] ?? initialHeadingDeg,
        targetHeadingDeg: activeNeedleStates[index]?.targetHeadingDeg ?? initialHeadingDeg,
      })),
    [activeNeedleStates, initialHeadingDeg, needleHeadingsDeg, needlePlacements],
  )

  useEffect(() => {
    let frameId = 0
    let previous = performance.now()

    const frame = (now: number) => {
      const deltaS = Math.min(0.05, (now - previous) / 1000)
      previous = now

      setNeedleHeadingsDeg((previousHeadings) =>
        previousHeadings.map((heading, index) =>
          stepNeedleHeading(
            heading,
            activeNeedleStates[index]?.targetHeadingDeg ?? heading,
            deltaS,
            running ? 8 : 4.5,
          ),
        ),
      )

      setPhase((value) => {
        const speed = running ? 0.34 * (currentA >= 0 ? 1 : -1) : 0
        return wrapPhase(value + deltaS * speed)
      })

      frameId = requestAnimationFrame(frame)
    }

    frameId = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(frameId)
  }, [activeNeedleStates, currentA, running])

  const setNeedlePlacementByDrag = (index: number, placement: NeedlePlacement) => {
    setActivePresetId('custom')
    setNeedlePlacements((previous) =>
      previous.map((needle, needleIndex) => {
        if (needleIndex !== index) {
          return needle
        }
        if (Math.abs(needle.x - placement.x) < 1e-6 && Math.abs(needle.z - placement.z) < 1e-6) {
          return needle
        }
        return placement
      }),
    )

    if (!running) {
      setNeedleHeadingsDeg((previous) =>
        previous.map((heading, needleIndex) => (needleIndex === index ? initialHeadingDeg : heading)),
      )
    }
  }

  const setAllNeedleHeadings = (headingDeg: number) => {
    setNeedleHeadingsDeg((previous) => previous.map(() => headingDeg))
  }

  const resetNeedles = () => {
    setRunning(false)
    setInitialHeadingDeg(EARTH_NORTH_HEADING_DEG)
    setAllNeedleHeadings(EARTH_NORTH_HEADING_DEG)
    setPhase(0)
    setActivePresetId('custom')
    setDraggingNeedleIndex(null)
  }

  const applyPreset = (preset: OerstedPreset) => {
    setCurrentA(preset.currentA)
    setEarthFieldMicroT(preset.earthFieldMicroT)
    setWireAzimuthDeg(preset.wireAzimuthDeg)
    setWirePitchDeg(preset.wirePitchDeg)
    setWireHeightM(preset.wireHeightM)
    setInitialHeadingDeg(preset.initialHeadingDeg)
    setNeedlePlacements(cloneNeedlePlacements(preset.needlePlacements))
    setNeedleHeadingsDeg(preset.needlePlacements.map(() => preset.initialHeadingDeg))
    setRunning(false)
    setPhase(0)
    setActivePresetId(preset.id)
    setDraggingNeedleIndex(null)
  }

  const activePresetTip =
    activePresetId === 'custom'
      ? '已进入自定义参数，可继续在三维空间内调节导线和磁针摆放。'
      : OERSTED_PRESETS.find((preset) => preset.id === activePresetId)?.tip ?? '已进入课堂预设位。'

  const maxSwing = previewNeedleStates.reduce(
    (maxValue, state) => Math.max(maxValue, Math.abs(state.observedSwingDeg)),
    0,
  )
  const discoveryText = describeDiscoveryLevel(maxSwing < 6 ? 'low' : maxSwing < 16 ? 'medium' : 'high')

  const markCustom = () => setActivePresetId('custom')

  return {
    currentA,
    earthFieldMicroT,
    wireAzimuthDeg,
    wirePitchDeg,
    wireHeightM,
    initialHeadingDeg,
    running,
    phase,
    showFieldLines,
    activePresetId,
    activePresetTip,
    wireDirection,
    previewNeedleStates,
    visualNeedles,
    maxSwing,
    discoveryText,
    draggingNeedleIndex,
    applyPreset,
    onCurrentChange: (value) => {
      markCustom()
      setCurrentA(value)
    },
    onEarthFieldChange: (value) => {
      markCustom()
      setEarthFieldMicroT(value)
    },
    onWireAzimuthChange: (value) => {
      markCustom()
      setWireAzimuthDeg(value)
    },
    onWirePitchChange: (value) => {
      markCustom()
      setWirePitchDeg(value)
    },
    onWireHeightChange: (value) => {
      markCustom()
      setWireHeightM(value)
    },
    onInitialHeadingChange: (value) => {
      markCustom()
      setInitialHeadingDeg(value)
      if (!running) {
        setAllNeedleHeadings(value)
      }
    },
    toggleRunning: () => setRunning((value) => !value),
    resetNeedles,
    toggleFieldLines: () => setShowFieldLines((value) => !value),
    setNeedlePlacementByDrag,
    startNeedleDrag: (index) => {
      markCustom()
      setDraggingNeedleIndex(index)
    },
    endNeedleDrag: () => setDraggingNeedleIndex(null),
  }
}
