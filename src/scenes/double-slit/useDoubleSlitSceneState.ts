import { useCallback, useMemo, useState } from 'react'
import {
  DEFAULT_PARAMS,
  type DoubleSlitParams,
  type FilterColor,
  formatFringeSpacing,
  waveLengthToHex,
} from './model'

export type DoubleSlitSceneState = DoubleSlitParams & {
  lightColorHex: number
  fringeSpacingLabel: string
  showChart: boolean
  isLightOn: boolean
  setWavelength: (value: number) => void
  setSlitDistance: (value: number) => void
  setScreenDistance: (value: number) => void
  setSlitWidth: (value: number) => void
  toggleChart: () => void
  toggleLight: () => void
  reset: () => void
  isWhiteLight: boolean
  toggleWhiteLight: () => void
  filterColor: FilterColor
  setFilterColor: (value: FilterColor) => void
  singleSlitAngle: number
  setSingleSlitAngle: (value: number) => void
  doubleSlitAngle: number
  setDoubleSlitAngle: (value: number) => void
  eyepieceAngle: number
  setEyepieceAngle: (value: number) => void
}

export function useDoubleSlitSceneState(): DoubleSlitSceneState {
  const [params, setParams] = useState<DoubleSlitParams>(DEFAULT_PARAMS)
  const [showChart, setShowChart] = useState(true)
  const [isLightOn, setIsLightOn] = useState(false)
  const [isWhiteLight, setIsWhiteLight] = useState(false)
  const [filterColor, setFilterColorState] = useState<FilterColor>('none')
  const [singleSlitAngle, setSingleSlitAngle] = useState(0)
  const [doubleSlitAngle, setDoubleSlitAngle] = useState(0)
  const [eyepieceAngle, setEyepieceAngle] = useState(0)

  const lightColorHex = useMemo(() => waveLengthToHex(params.wavelength), [params.wavelength])
  const fringeSpacingLabel = useMemo(() => formatFringeSpacing(params), [params])

  const setWavelength = useCallback((value: number) => {
    setParams((prev) => ({ ...prev, wavelength: value }))
  }, [])

  const setSlitDistance = useCallback((value: number) => {
    setParams((prev) => ({ ...prev, slitDistance: value }))
  }, [])

  const setScreenDistance = useCallback((value: number) => {
    setParams((prev) => ({ ...prev, screenDistance: value }))
  }, [])

  const setSlitWidth = useCallback((value: number) => {
    setParams((prev) => ({ ...prev, slitWidth: value }))
  }, [])

  const toggleChart = useCallback(() => {
    setShowChart((prev) => !prev)
  }, [])

  const toggleLight = useCallback(() => {
    setIsLightOn((prev) => !prev)
  }, [])

  const toggleWhiteLight = useCallback(() => {
    setIsWhiteLight((prev) => {
      if (prev) setFilterColorState('none') // switching off white light clears filter
      return !prev
    })
  }, [])

  const setFilterColor = useCallback((value: FilterColor) => {
    setFilterColorState(value)
  }, [])

  const reset = useCallback(() => {
    setParams(DEFAULT_PARAMS)
    setShowChart(true)
    setIsLightOn(false)
    setIsWhiteLight(false)
    setFilterColorState('none')
    setSingleSlitAngle(0)
    setDoubleSlitAngle(0)
    setEyepieceAngle(0)
  }, [])

  return {
    ...params,
    lightColorHex,
    fringeSpacingLabel,
    showChart,
    isLightOn,
    setWavelength,
    setSlitDistance,
    setScreenDistance,
    setSlitWidth,
    toggleChart,
    toggleLight,
    reset,
    isWhiteLight,
    toggleWhiteLight,
    filterColor,
    setFilterColor,
    singleSlitAngle,
    setSingleSlitAngle,
    doubleSlitAngle,
    setDoubleSlitAngle,
    eyepieceAngle,
    setEyepieceAngle,
  }
}
