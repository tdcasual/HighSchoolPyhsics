import { useMemo, useState } from 'react'
import { recall, useRemember } from '../../app/sceneMemory/sceneMemory'
import { buildPotentialSlicePoints, POTENTIAL_SURFACE_FULL_ANGLE, summarizeSlice } from './model'

/** The φ–r slice opens immediately; 旋转生成曲面 sweeps it once around the charge into a surface. */
export function usePotentialEnergySceneState() {
  const [chargeSign, setChargeSign] = useState<1 | -1>(() => recall('potential-energy.chargeSign', 1))
  useRemember('potential-energy', { chargeSign })
  const [surfaceVisible, setSurfaceVisible] = useState(false)
  const [rotationInProgress, setRotationInProgress] = useState(false)
  const [sweepAngle, setSweepAngle] = useState(0.01)

  const slicePoints = useMemo(() => buildPotentialSlicePoints(chargeSign), [chargeSign])
  const sliceStats = useMemo(() => summarizeSlice(slicePoints), [slicePoints])

  const toggleChargeSign = () => {
    setChargeSign((value) => (value > 0 ? -1 : 1))
    if (surfaceVisible && !rotationInProgress) setSweepAngle(POTENTIAL_SURFACE_FULL_ANGLE)
  }

  return {
    chargeSign,
    surfaceVisible,
    rotationInProgress,
    sweepAngle,
    slicePoints,
    sliceStats,
    sweepProgress: Math.min(100, (sweepAngle / POTENTIAL_SURFACE_FULL_ANGLE) * 100),
    setSweepAngle,
    toggleChargeSign,
    setChargeSign: (sign: 1 | -1) => {
      if (sign !== chargeSign) toggleChargeSign()
    },
    startRotation: () => {
      setSurfaceVisible(true)
      setRotationInProgress(true)
      setSweepAngle(0.01)
    },
    completeRotation: () => setRotationInProgress(false),
    reset: () => {
      setSurfaceVisible(false)
      setRotationInProgress(false)
      setSweepAngle(0.01)
    },
  }
}

export type PotentialEnergySceneState = ReturnType<typeof usePotentialEnergySceneState>
