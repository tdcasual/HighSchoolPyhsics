import { useMemo, useRef, useState } from 'react'
import { recall, useRemember } from '../../app/sceneMemory/sceneMemory'
import { useSimulationClock } from '../../simulation/useSimulationClock'
import type { Transport } from '../../simulation/clockActions'
import { buildPotentialSlicePoints, POTENTIAL_SURFACE_FULL_ANGLE, summarizeSlice } from './model'

/** Sweep rate of the slice around the charge (rad per second at 1×). */
const SWEEP_RATE = 2.3
/** 单步: 15° of sweep. */
const SWEEP_STEP = Math.PI / 12
/** A closed sweep still shows a sliver of surface, so it never degenerates. */
const SWEEP_START = 0.01

/** The φ–r slice opens immediately; 旋转生成曲面 sweeps it once around the charge into a surface. */
export function usePotentialEnergySceneState() {
  const [chargeSign, setChargeSign] = useState<1 | -1>(() => recall('potential-energy.chargeSign', 1))
  useRemember('potential-energy', { chargeSign })
  const [surfaceVisible, setSurfaceVisible] = useState(false)
  const [sweepAngle, setSweepAngle] = useState(SWEEP_START)
  const sweepRef = useRef(SWEEP_START)

  const clock = useSimulationClock({
    advance: (dt) => {
      const next = Math.min(POTENTIAL_SURFACE_FULL_ANGLE, sweepRef.current + dt * SWEEP_RATE)
      sweepRef.current = next
      setSweepAngle(next)
      return next < POTENTIAL_SURFACE_FULL_ANGLE
    },
    stepSeconds: SWEEP_STEP / SWEEP_RATE,
    honourPlaybackRate: true,
  })

  const slicePoints = useMemo(() => buildPotentialSlicePoints(chargeSign), [chargeSign])
  const sliceStats = useMemo(() => summarizeSlice(slicePoints), [slicePoints])
  const complete = sweepAngle >= POTENTIAL_SURFACE_FULL_ANGLE

  const restart = () => {
    sweepRef.current = SWEEP_START
    setSweepAngle(SWEEP_START)
  }
  /** Before time runs: show the surface, and start over once a sweep has finished. */
  const prepare = () => {
    setSurfaceVisible(true)
    if (complete) restart()
  }
  const transport: Transport = {
    running: clock.running,
    toggle: () => {
      if (!clock.running) prepare()
      clock.toggle()
    },
    step: () => {
      prepare()
      clock.step()
    },
  }

  const toggleChargeSign = () => setChargeSign((value) => (value > 0 ? -1 : 1))

  return {
    chargeSign,
    surfaceVisible,
    rotationInProgress: clock.running,
    complete,
    sweepAngle,
    slicePoints,
    sliceStats,
    sweepProgress: Math.min(100, (sweepAngle / POTENTIAL_SURFACE_FULL_ANGLE) * 100),
    clock,
    transport,
    toggleChargeSign,
    setChargeSign: (sign: 1 | -1) => {
      if (sign !== chargeSign) toggleChargeSign()
    },
    reset: () => {
      clock.pause()
      setSurfaceVisible(false)
      restart()
    },
  }
}

export type PotentialEnergySceneState = ReturnType<typeof usePotentialEnergySceneState>
