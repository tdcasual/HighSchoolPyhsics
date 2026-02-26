import { useMemo } from 'react'
import { useParticleSimulation } from '../../core/useParticleSimulation'
import type { ParticleState } from '../../core/types'
import { computeOscilloscopeAcceleration } from './runtime'

export function useOscilloscopeSimulation(dt: number, initialSpeed: number) {
  const initialState = useMemo<ParticleState>(
    () => ({
      position: { x: 0, y: 0, z: 0 },
      velocity: { x: Math.max(0.05, initialSpeed), y: 0, z: 0 },
    }),
    [initialSpeed],
  )

  const acceleration = useMemo(() => () => computeOscilloscopeAcceleration(), [])

  return useParticleSimulation({
    initialState,
    dt,
    computeAcceleration: acceleration,
    runningByDefault: false,
    autoResetOnInitialStateChange: true,
  })
}
