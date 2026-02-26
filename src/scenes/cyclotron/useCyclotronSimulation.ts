import { useMemo } from 'react'
import { useParticleSimulation } from '../../core/useParticleSimulation'
import type { ParticleState } from '../../core/types'
import type { CyclotronConfig } from './model'
import { computeCyclotronAcceleration } from './runtime'

export const CYCLOTRON_DEFAULT_INITIAL_SPEED_MPS = 2.4e4

const DEFAULT_STATE: ParticleState = {
  position: { x: 0, y: 0, z: 0 },
  velocity: { x: CYCLOTRON_DEFAULT_INITIAL_SPEED_MPS, y: 0, z: 0 },
}

export function useCyclotronSimulation(
  config: CyclotronConfig,
  dt: number,
  initialState: ParticleState = DEFAULT_STATE,
) {
  const acceleration = useMemo(
    () => (state: ParticleState) => computeCyclotronAcceleration(state, config),
    [config],
  )

  return useParticleSimulation({
    initialState,
    dt,
    computeAcceleration: acceleration,
    runningByDefault: false,
    autoResetOnInitialStateChange: true,
  })
}
