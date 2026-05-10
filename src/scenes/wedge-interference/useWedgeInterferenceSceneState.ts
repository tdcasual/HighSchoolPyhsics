import { useCallback, useMemo, useState } from 'react'
import {
  DEFAULT_PARAMS,
  type WedgeParams,
  type WedgeMode,
  formatFringeSpacing,
  computeFringeCount,
  waveLengthToHex,
} from './model'

export type WedgeInterferenceSceneState = WedgeParams & {
  lightColorHex: number
  fringeSpacingLabel: string
  fringeCount: number
  showChart: boolean
  isLightOn: boolean
  isScanning: boolean
  setWavelength: (value: number) => void
  setWedgeAngle: (value: number) => void
  setMaxThickness: (value: number) => void
  setMode: (value: WedgeMode) => void
  setBumpHeight: (value: number) => void
  setBumpPosition: (value: number) => void
  toggleChart: () => void
  toggleLight: () => void
  toggleScan: () => void
  reset: () => void
}

export function useWedgeInterferenceSceneState(): WedgeInterferenceSceneState {
  const [params, setParams] = useState<WedgeParams>(DEFAULT_PARAMS)
  const [showChart, setShowChart] = useState(true)
  const [isLightOn, setIsLightOn] = useState(true)
  const [isScanning, setIsScanning] = useState(false)

  const lightColorHex = useMemo(() => waveLengthToHex(params.wavelength), [params.wavelength])
  const fringeSpacingLabel = useMemo(() => formatFringeSpacing(params), [params])
  const fringeCount = useMemo(() => computeFringeCount(params), [params])

  const setWavelength = useCallback((value: number) => {
    setParams((prev) => ({ ...prev, wavelength: value }))
  }, [])

  const setWedgeAngle = useCallback((value: number) => {
    setParams((prev) => ({ ...prev, wedgeAngle: value }))
  }, [])

  const setMaxThickness = useCallback((value: number) => {
    setParams((prev) => ({ ...prev, maxThickness: value }))
  }, [])

  const setMode = useCallback((value: WedgeMode) => {
    setParams((prev) => ({ ...prev, mode: value }))
  }, [])

  const setBumpHeight = useCallback((value: number) => {
    setParams((prev) => ({ ...prev, bumpHeight: value }))
  }, [])

  const setBumpPosition = useCallback((value: number) => {
    setParams((prev) => ({ ...prev, bumpPosition: value }))
  }, [])

  const toggleChart = useCallback(() => {
    setShowChart((prev) => !prev)
  }, [])

  const toggleLight = useCallback(() => {
    setIsLightOn((prev) => !prev)
  }, [])

  const toggleScan = useCallback(() => {
    setIsScanning((prev) => !prev)
  }, [])

  const reset = useCallback(() => {
    setParams(DEFAULT_PARAMS)
    setShowChart(true)
    setIsLightOn(true)
    setIsScanning(false)
  }, [])

  return {
    ...params,
    lightColorHex,
    fringeSpacingLabel,
    fringeCount,
    showChart,
    isLightOn,
    isScanning,
    setWavelength,
    setWedgeAngle,
    setMaxThickness,
    setMode,
    setBumpHeight,
    setBumpPosition,
    toggleChart,
    toggleLight,
    toggleScan,
    reset,
  }
}
