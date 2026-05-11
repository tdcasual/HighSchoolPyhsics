import { useCallback, useMemo, useState } from 'react'
import {
  DEFAULT_MODE,
  DEFAULT_PARAMS,
  clampApertureSize,
  formatFeatureLabel,
  formatFeatureValue,
  waveLengthToHex,
  type DiffractionMode,
  type DiffractionParams,
  type FilterColor,
} from './model'

export type LightDiffractionSceneState = DiffractionParams & {
  mode: DiffractionMode
  lightColorHex: number
  featureLabel: string
  featureValue: string
  showChart: boolean
  isLightOn: boolean
  isWhiteLight: boolean
  filterColor: FilterColor
  eyepieceAngle: number

  // Actions
  setMode: (value: DiffractionMode) => void
  setWavelength: (value: number) => void
  setApertureSize: (value: number) => void
  setScreenDistance: (value: number) => void
  setGratingLines: (value: number) => void
  toggleChart: () => void
  toggleLight: () => void
  toggleWhiteLight: () => void
  setFilterColor: (value: FilterColor) => void
  setEyepieceAngle: (value: number) => void
  reset: () => void
}

export function useLightDiffractionSceneState(): LightDiffractionSceneState {
  const [params, setParams] = useState<DiffractionParams>(DEFAULT_PARAMS)
  const [mode, setModeState] = useState<DiffractionMode>(DEFAULT_MODE)
  const [showChart, setShowChart] = useState(true)
  const [isLightOn, setIsLightOn] = useState(true)
  const [isWhiteLight, setIsWhiteLight] = useState(false)
  const [filterColor, setFilterColorState] = useState<FilterColor>('none')
  const [eyepieceAngle, setEyepieceAngle] = useState(0)

  const lightColorHex = useMemo(() => waveLengthToHex(params.wavelength), [params.wavelength])
  const featureLabel = useMemo(() => formatFeatureLabel(mode), [mode])
  const featureValue = useMemo(() => formatFeatureValue(params, mode), [params, mode])

  const setMode = useCallback((value: DiffractionMode) => {
    setModeState((prev) => {
      if (prev === value) return prev
      // Clamp aperture size to new mode's range
      setParams((p) => ({
        ...p,
        apertureSize: clampApertureSize(value, p.apertureSize),
      }))
      return value
    })
  }, [])

  const setWavelength = useCallback((value: number) => {
    setParams((prev) => ({ ...prev, wavelength: value }))
  }, [])

  const setApertureSize = useCallback((value: number) => {
    setParams((prev) => ({ ...prev, apertureSize: clampApertureSize(mode, value) }))
  }, [mode])

  const setScreenDistance = useCallback((value: number) => {
    setParams((prev) => ({ ...prev, screenDistance: value }))
  }, [])

  const setGratingLines = useCallback((value: number) => {
    setParams((prev) => ({ ...prev, gratingLines: value }))
  }, [])

  const toggleChart = useCallback(() => {
    setShowChart((prev) => !prev)
  }, [])

  const toggleLight = useCallback(() => {
    setIsLightOn((prev) => !prev)
  }, [])

  const toggleWhiteLight = useCallback(() => {
    setIsWhiteLight((prev) => {
      if (prev) setFilterColorState('none')
      return !prev
    })
  }, [])

  const setFilterColor = useCallback((value: FilterColor) => {
    setFilterColorState(value)
  }, [])

  const setEyepieceAngleCb = useCallback((value: number) => {
    setEyepieceAngle(value)
  }, [])

  const reset = useCallback(() => {
    setParams(DEFAULT_PARAMS)
    setModeState(DEFAULT_MODE)
    setShowChart(true)
    setIsLightOn(true)
    setIsWhiteLight(false)
    setFilterColorState('none')
    setEyepieceAngle(0)
  }, [])

  return {
    ...params,
    mode,
    lightColorHex,
    featureLabel,
    featureValue,
    showChart,
    isLightOn,
    isWhiteLight,
    filterColor,
    eyepieceAngle,
    setMode,
    setWavelength,
    setApertureSize,
    setScreenDistance,
    setGratingLines,
    toggleChart,
    toggleLight,
    toggleWhiteLight,
    setFilterColor,
    setEyepieceAngle: setEyepieceAngleCb,
    reset,
  }
}
