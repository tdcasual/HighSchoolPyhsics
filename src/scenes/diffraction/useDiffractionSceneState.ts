import { recall, useRemember } from '../../app/sceneMemory/sceneMemory'
import { useState, useCallback, useMemo } from 'react'
import {
  type DiffractionMode,
  type DiffractionParams,
  type FilterColor,
  DEFAULT_PARAMS,
  DEFAULT_MODE,
  clampApertureSize,
  constrainScreenDistance,
  resolveMinimumScreenDistance,
} from '../../domains/optics/diffraction'

export type { DiffractionMode, DiffractionParams, FilterColor }

const MODE_DEFAULT_APERTURE: Record<DiffractionMode, number> = {
  'single-slit': 0.1,
  'circular-aperture': 0.2,
  'circular-obstacle': 0.5,
  'diffraction-grating': 0.1,
}

export type DiffractionSceneState = {
  mode: DiffractionMode
  params: DiffractionParams
  minScreenDistance: number
  isLightOn: boolean
  isWhiteLight: boolean
  filterColor: FilterColor
  showPattern: boolean
  showProfile: boolean
  lightColorHex: number
  toggleLight: () => void
  setMode: (mode: DiffractionMode) => void
  setWavelength: (v: number) => void
  setApertureSize: (v: number) => void
  setScreenDistance: (v: number) => void
  setGratingLines: (v: number) => void
  toggleWhiteLight: () => void
  setFilterColor: (c: FilterColor) => void
  togglePattern: () => void
  toggleProfile: () => void
  reset: () => void
}

export function useDiffractionSceneState(): DiffractionSceneState {
  const [mode, setModeRaw] = useState<DiffractionMode>(() => recall('diffraction.mode', DEFAULT_MODE))
  const [params, setParams] = useState<DiffractionParams>(() =>
    recall('diffraction.params', { ...DEFAULT_PARAMS, screenDistance: 0.5 }),
  )
  const [isLightOn, setIsLightOn] = useState(true)
  const [isWhiteLight, setIsWhiteLight] = useState(() => recall('diffraction.isWhiteLight', false))
  const [filterColor, setFilterColor] = useState<FilterColor>(() => recall('diffraction.filterColor', 'none'))
  const [showPattern, setShowPattern] = useState(() => recall('diffraction.showPattern', true))
  const [showProfile, setShowProfile] = useState(() => recall('diffraction.showProfile', false))
  useRemember('diffraction', { mode, params, isWhiteLight, filterColor, showPattern, showProfile })
  const minScreenDistance = useMemo(
    () => resolveMinimumScreenDistance(mode, params, isWhiteLight),
    [mode, params, isWhiteLight],
  )

  const lightColorHex = useMemo(() => {
    if (isWhiteLight) {
      if (filterColor === 'none') return 0xffffff
      if (filterColor === 'red') return 0xff4444
      if (filterColor === 'green') return 0x44cc44
      return 0x4488ff
    }
    const wl = params.wavelength
    let r = 0,
      g = 0,
      b = 0
    if (wl >= 380 && wl < 440) {
      r = -(wl - 440) / (440 - 380)
      g = 0
      b = 1
    } else if (wl >= 440 && wl < 490) {
      r = 0
      g = (wl - 440) / (490 - 440)
      b = 1
    } else if (wl >= 490 && wl < 510) {
      r = 0
      g = 1
      b = -(wl - 510) / (510 - 490)
    } else if (wl >= 510 && wl < 580) {
      r = (wl - 510) / (580 - 510)
      g = 1
      b = 0
    } else if (wl >= 580 && wl < 645) {
      r = 1
      g = -(wl - 645) / (645 - 580)
      b = 0
    } else if (wl >= 645 && wl <= 780) {
      r = 1
      g = 0
      b = 0
    }
    const factor =
      wl >= 380 && wl < 420
        ? 0.3 + (0.7 * (wl - 380)) / (420 - 380)
        : wl >= 420 && wl <= 700
          ? 1
          : wl > 700 && wl <= 780
            ? 0.3 + (0.7 * (780 - wl)) / (780 - 700)
            : 0
    const R = Math.round(Math.max(0, Math.min(255, r * factor * 255)))
    const G = Math.round(Math.max(0, Math.min(255, g * factor * 255)))
    const B = Math.round(Math.max(0, Math.min(255, b * factor * 255)))
    return (R << 16) | (G << 8) | B
  }, [params.wavelength, isWhiteLight, filterColor])

  const toggleLight = useCallback(() => setIsLightOn((p) => !p), [])
  const togglePattern = useCallback(() => setShowPattern((p) => !p), [])
  const toggleProfile = useCallback(() => setShowProfile((p) => !p), [])
  const toggleWhiteLight = useCallback(() => {
    const nextWhiteLight = !isWhiteLight
    setIsWhiteLight(nextWhiteLight)
    setParams((p) => constrainScreenDistance(mode, p, nextWhiteLight))
  }, [isWhiteLight, mode])

  const setMode = useCallback(
    (m: DiffractionMode) => {
      setModeRaw(m)
      setParams((p) => constrainScreenDistance(m, { ...p, apertureSize: MODE_DEFAULT_APERTURE[m] }, isWhiteLight))
    },
    [isWhiteLight],
  )

  const setWavelength = useCallback(
    (v: number) =>
      setParams((p) => {
        const next = { ...p, wavelength: v }
        return constrainScreenDistance(mode, next, isWhiteLight)
      }),
    [isWhiteLight, mode],
  )
  const setApertureSize = useCallback(
    (v: number) =>
      setParams((p) => {
        const next = { ...p, apertureSize: clampApertureSize(mode, v) }
        return constrainScreenDistance(mode, next, isWhiteLight)
      }),
    [isWhiteLight, mode],
  )
  const setScreenDistance = useCallback(
    (v: number) =>
      setParams((p) => ({
        ...p,
        screenDistance: Math.max(v, resolveMinimumScreenDistance(mode, p, isWhiteLight)),
      })),
    [isWhiteLight, mode],
  )
  const setGratingLines = useCallback(
    (v: number) =>
      setParams((p) => {
        const next = { ...p, gratingLines: v }
        return constrainScreenDistance(mode, next, isWhiteLight)
      }),
    [isWhiteLight, mode],
  )

  const reset = useCallback(() => {
    setModeRaw(DEFAULT_MODE)
    setParams({ ...DEFAULT_PARAMS, screenDistance: 0.5 })
    setIsLightOn(true)
    setIsWhiteLight(false)
    setFilterColor('none')
    setShowPattern(true)
    setShowProfile(false)
  }, [])

  return {
    mode,
    params,
    minScreenDistance,
    isLightOn,
    isWhiteLight,
    filterColor,
    showPattern,
    showProfile,
    lightColorHex,
    toggleLight,
    setMode,
    setWavelength,
    setApertureSize,
    setScreenDistance,
    setGratingLines,
    toggleWhiteLight,
    setFilterColor,
    togglePattern,
    toggleProfile,
    reset,
  }
}
