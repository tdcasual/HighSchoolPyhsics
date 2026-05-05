import { useCallback, useMemo, useState } from 'react'
import {
  DEFAULT_PARAMS,
  type DoubleSlitParams,
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
  toggleChart: () => void
  toggleLight: () => void
  reset: () => void
}

export function useDoubleSlitSceneState(): DoubleSlitSceneState {
  const [params, setParams] = useState<DoubleSlitParams>(DEFAULT_PARAMS)
  const [showChart, setShowChart] = useState(true)
  const [isLightOn, setIsLightOn] = useState(false)

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

  const toggleChart = useCallback(() => {
    setShowChart((prev) => !prev)
  }, [])

  const toggleLight = useCallback(() => {
    setIsLightOn((prev) => !prev)
  }, [])

  const reset = useCallback(() => {
    setParams(DEFAULT_PARAMS)
    setShowChart(true)
    setIsLightOn(false)
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
    toggleChart,
    toggleLight,
    reset,
  }
}
