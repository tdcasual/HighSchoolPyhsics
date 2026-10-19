import { useMemo } from 'react'
import { getPlaybackRate } from '../../scene3d/playbackRate'
import { useParticleSimulation } from '../../core/useParticleSimulation'
import type { ParticleState } from '../../core/types'
import type { CyclotronConfig } from './model'
import { MAX_ORBIT_RADIUS_M } from './layout'
import { computeCyclotronAcceleration, computeCyclotronStepAcceleration } from './runtime'

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
    computeAccelerationAtTime: (state, timeS, stepDt) =>
      computeCyclotronStepAcceleration(state, config, timeS, stepDt),
    shouldStop: (state) => Math.hypot(state.position.x, state.position.y) >= MAX_ORBIT_RADIUS_M,
    runningByDefault: false,
    getTimeScale: getPlaybackRate,
    autoResetOnInitialStateChange: true,
  })
}
