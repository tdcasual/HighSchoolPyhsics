import { useMemo } from 'react'
import { useParticleSimulation } from '../../core/useParticleSimulation'
import type { ParticleState } from '../../core/types'
import { computeOscilloscopeAcceleration } from './runtime'

const DEFAULT_STEP_S = 1 / 240
const DEFAULT_TIME_RATE = 1
const MIN_TIME_RATE = 0.05
const MAX_TIME_RATE = 3

export function useOscilloscopeSimulation(dt: number, timeRate: number) {
  const safeStepS = Number.isFinite(dt) && dt > 0 ? dt : DEFAULT_STEP_S
  const safeTimeRate = Number.isFinite(timeRate)
    ? Math.min(MAX_TIME_RATE, Math.max(MIN_TIME_RATE, timeRate))
    : DEFAULT_TIME_RATE
  const initialState = useMemo<ParticleState>(
    () => ({
      position: { x: 0, y: 0, z: 0 },
      velocity: { x: 1, y: 0, z: 0 },
    }),
    [],
  )

  const acceleration = useMemo(() => () => computeOscilloscopeAcceleration(), [])

  return useParticleSimulation({
    initialState,
    dt: safeStepS * safeTimeRate,
    computeAcceleration: acceleration,
    runningByDefault: false,
  })
}
