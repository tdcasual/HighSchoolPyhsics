import { recall, useRemember } from '../../app/sceneMemory/sceneMemory'
import { useCallback, useMemo, useState } from 'react'
import {
  DEFAULT_PARAMS,
  type DoubleSlitParams,
  type FilterColor,
  formatFringeSpacing,
  formatWhiteLightFringeRange,
  waveLengthToHex,
} from './model'
import {
  clampMicrometerReadout,
  computeWavelengthMeasurement,
  DEFAULT_FRINGE_COUNT,
  INITIAL_MEASUREMENT_READOUT_MM,
  type WavelengthMeasurement,
} from './measurement'

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
  isBlindMode: boolean
  setBlindMode: (value: boolean) => void
  wheelReadoutMm: number
  setWheelReadoutMm: (value: number) => void
  stepWheel: (deltaMm: number) => void
  fringeCount: number
  setFringeCount: (value: number) => void
  firstReadingMm: number | null
  secondReadingMm: number | null
  recordFirstReading: () => void
  recordSecondReading: () => void
  measurementResult: WavelengthMeasurement | null
  calculateMeasuredWavelength: () => void
  clearMeasurements: () => void
  showFringeOrders: boolean
  toggleFringeOrders: () => void
}

export function useDoubleSlitSceneState(): DoubleSlitSceneState {
  const [params, setParams] = useState<DoubleSlitParams>(() => recall('double-slit.params', DEFAULT_PARAMS))
  const [showChart, setShowChart] = useState(() => recall('double-slit.showChart', true))
  const [isLightOn, setIsLightOn] = useState(true)
  const [isWhiteLight, setIsWhiteLight] = useState(() => recall('double-slit.isWhiteLight', false))
  const [filterColor, setFilterColorState] = useState<FilterColor>(() => recall('double-slit.filterColor', 'none'))
  const [singleSlitAngle, setSingleSlitAngle] = useState(() => recall('double-slit.singleSlitAngle', 0))
  const [doubleSlitAngle, setDoubleSlitAngle] = useState(() => recall('double-slit.doubleSlitAngle', 0))
  const [eyepieceAngle, setEyepieceAngle] = useState(() => recall('double-slit.eyepieceAngle', 0))
  const [isBlindMode, setIsBlindModeState] = useState(() => recall('double-slit.isBlindMode', false))
  const [wheelReadoutMm, setWheelReadoutMmState] = useState(INITIAL_MEASUREMENT_READOUT_MM)
  const [fringeCount, setFringeCountState] = useState(() => recall('double-slit.fringeCount', DEFAULT_FRINGE_COUNT))
  const [firstReadingMm, setFirstReadingMm] = useState<number | null>(null)
  const [secondReadingMm, setSecondReadingMm] = useState<number | null>(null)
  const [measurementResult, setMeasurementResult] = useState<WavelengthMeasurement | null>(null)
  const [showFringeOrders, setShowFringeOrders] = useState(() => recall('double-slit.showFringeOrders', true))
  useRemember('double-slit', {
    params,
    showChart,
    isWhiteLight,
    filterColor,
    singleSlitAngle,
    doubleSlitAngle,
    eyepieceAngle,
    isBlindMode,
    fringeCount,
    showFringeOrders,
  })

  const lightColorHex = useMemo(() => waveLengthToHex(params.wavelength), [params.wavelength])
  const fringeSpacingLabel = useMemo(
    () => (isWhiteLight ? formatWhiteLightFringeRange(params, filterColor) : formatFringeSpacing(params)),
    [isWhiteLight, filterColor, params],
  )

  const setWavelength = useCallback((value: number) => {
    setParams((prev) => ({ ...prev, wavelength: value }))
    setMeasurementResult(null)
  }, [])

  const setSlitDistance = useCallback((value: number) => {
    setParams((prev) => ({ ...prev, slitDistance: value }))
    setMeasurementResult(null)
  }, [])

  const setScreenDistance = useCallback((value: number) => {
    setParams((prev) => ({ ...prev, screenDistance: value }))
    setMeasurementResult(null)
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
      if (prev) setFilterColorState('none')
      else setIsBlindModeState(false)
      return !prev
    })
    setMeasurementResult(null)
  }, [])

  const setFilterColor = useCallback((value: FilterColor) => {
    setFilterColorState(value)
    setMeasurementResult(null)
  }, [])

  const setBlindMode = useCallback(
    (value: boolean) => {
      setIsBlindModeState(value && !isWhiteLight)
      setMeasurementResult(null)
    },
    [isWhiteLight],
  )

  const setWheelReadoutMm = useCallback((value: number) => {
    setWheelReadoutMmState(clampMicrometerReadout(value))
    setMeasurementResult(null)
  }, [])

  const stepWheel = useCallback((deltaMm: number) => {
    setWheelReadoutMmState((previous) => clampMicrometerReadout(previous + deltaMm))
    setMeasurementResult(null)
  }, [])

  const setFringeCount = useCallback((value: number) => {
    setFringeCountState(Math.min(11, Math.max(2, Math.round(value))))
    setMeasurementResult(null)
  }, [])

  const recordFirstReading = useCallback(() => {
    setFirstReadingMm(wheelReadoutMm)
    setSecondReadingMm(null)
    setMeasurementResult(null)
  }, [wheelReadoutMm])

  const recordSecondReading = useCallback(() => {
    setSecondReadingMm(wheelReadoutMm)
    setMeasurementResult(null)
  }, [wheelReadoutMm])

  const calculateMeasuredWavelength = useCallback(() => {
    if (firstReadingMm === null || secondReadingMm === null || isWhiteLight) {
      setMeasurementResult(null)
      return
    }
    setMeasurementResult(
      computeWavelengthMeasurement({
        slitDistanceMm: params.slitDistance,
        screenDistanceM: params.screenDistance,
        firstReadingMm,
        secondReadingMm,
        fringeCount,
      }),
    )
  }, [firstReadingMm, secondReadingMm, isWhiteLight, params.slitDistance, params.screenDistance, fringeCount])

  const clearMeasurements = useCallback(() => {
    setFirstReadingMm(null)
    setSecondReadingMm(null)
    setMeasurementResult(null)
  }, [])

  const toggleFringeOrders = useCallback(() => {
    setShowFringeOrders((previous) => !previous)
  }, [])

  const reset = useCallback(() => {
    setParams(DEFAULT_PARAMS)
    setShowChart(true)
    setIsLightOn(true)
    setIsWhiteLight(false)
    setFilterColorState('none')
    setSingleSlitAngle(0)
    setDoubleSlitAngle(0)
    setEyepieceAngle(0)
    setIsBlindModeState(false)
    setWheelReadoutMmState(INITIAL_MEASUREMENT_READOUT_MM)
    setFringeCountState(DEFAULT_FRINGE_COUNT)
    setFirstReadingMm(null)
    setSecondReadingMm(null)
    setMeasurementResult(null)
    setShowFringeOrders(true)
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
    isBlindMode,
    setBlindMode,
    wheelReadoutMm,
    setWheelReadoutMm,
    stepWheel,
    fringeCount,
    setFringeCount,
    firstReadingMm,
    secondReadingMm,
    recordFirstReading,
    recordSecondReading,
    measurementResult,
    calculateMeasuredWavelength,
    clearMeasurements,
    showFringeOrders,
    toggleFringeOrders,
  }
}
