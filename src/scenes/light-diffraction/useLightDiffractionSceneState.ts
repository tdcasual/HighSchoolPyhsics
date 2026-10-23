import { recall, useRemember } from '../../app/sceneMemory/sceneMemory'
import { useCallback, useMemo, useState } from 'react'
import {
  DEFAULT_MODE,
  DEFAULT_PARAMS,
  clampApertureSize,
  constrainScreenDistance,
  resolveMinimumScreenDistance,
  formatFeatureLabel,
  formatFeatureValue,
  waveLengthToHex,
  type DiffractionMode,
  type DiffractionParams,
  type FilterColor,
} from '../../domains/optics/diffraction'

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
  minScreenDistance: number

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
  const [params, setParams] = useState<DiffractionParams>(() => recall('light-diffraction.params', DEFAULT_PARAMS))
  const [mode, setModeState] = useState<DiffractionMode>(() => recall('light-diffraction.mode', DEFAULT_MODE))
  const [showChart, setShowChart] = useState(() => recall('light-diffraction.showChart', false))
  const [isLightOn, setIsLightOn] = useState(true)
  const [isWhiteLight, setIsWhiteLight] = useState(() => recall('light-diffraction.isWhiteLight', false))
  const [filterColor, setFilterColorState] = useState<FilterColor>(() =>
    recall('light-diffraction.filterColor', 'none'),
  )
  const [eyepieceAngle, setEyepieceAngle] = useState(() => recall('light-diffraction.eyepieceAngle', 0))
  useRemember('light-diffraction', { params, mode, showChart, isWhiteLight, filterColor, eyepieceAngle })

  const minScreenDistance = useMemo(
    () => resolveMinimumScreenDistance(mode, params, isWhiteLight),
    [mode, params, isWhiteLight],
  )
  const lightColorHex = useMemo(() => waveLengthToHex(params.wavelength), [params.wavelength])
  const featureLabel = useMemo(() => formatFeatureLabel(mode), [mode])
  const featureValue = useMemo(() => formatFeatureValue(params, mode), [params, mode])

  const setMode = useCallback(
    (value: DiffractionMode) => {
      setModeState(value)
      setParams((p) =>
        constrainScreenDistance(
          value,
          {
            ...p,
            apertureSize: clampApertureSize(value, p.apertureSize),
          },
          isWhiteLight,
        ),
      )
    },
    [isWhiteLight],
  )

  const setWavelength = useCallback(
    (value: number) => {
      setParams((prev) => constrainScreenDistance(mode, { ...prev, wavelength: value }, isWhiteLight))
    },
    [isWhiteLight, mode],
  )

  const setApertureSize = useCallback(
    (value: number) => {
      setParams((prev) =>
        constrainScreenDistance(
          mode,
          {
            ...prev,
            apertureSize: clampApertureSize(mode, value),
          },
          isWhiteLight,
        ),
      )
    },
    [isWhiteLight, mode],
  )

  const setScreenDistance = useCallback(
    (value: number) => {
      setParams((prev) => ({
        ...prev,
        screenDistance: Math.max(value, resolveMinimumScreenDistance(mode, prev, isWhiteLight)),
      }))
    },
    [isWhiteLight, mode],
  )

  const setGratingLines = useCallback(
    (value: number) => {
      setParams((prev) => constrainScreenDistance(mode, { ...prev, gratingLines: value }, isWhiteLight))
    },
    [isWhiteLight, mode],
  )

  const toggleChart = useCallback(() => {
    setShowChart((prev) => !prev)
  }, [])

  const toggleLight = useCallback(() => {
    setIsLightOn((prev) => !prev)
  }, [])

  const toggleWhiteLight = useCallback(() => {
    const nextWhiteLight = !isWhiteLight
    setIsWhiteLight(nextWhiteLight)
    if (isWhiteLight) setFilterColorState('none')
    setParams((prev) => constrainScreenDistance(mode, prev, nextWhiteLight))
  }, [isWhiteLight, mode])

  const setFilterColor = useCallback((value: FilterColor) => {
    setFilterColorState(value)
  }, [])

  const setEyepieceAngleCb = useCallback((value: number) => {
    setEyepieceAngle(value)
  }, [])

  const reset = useCallback(() => {
    setParams(DEFAULT_PARAMS)
    setModeState(DEFAULT_MODE)
    setShowChart(false)
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
    minScreenDistance,
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
