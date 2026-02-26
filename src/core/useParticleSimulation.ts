import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createDefaultSimulationStepper, type SimulationStepper } from '../workers/simClient'
import type { ParticleState, Vector3Like } from './types'

type Mode = 'worker' | 'local'

type Status = {
  mode: Mode
  error: string | null
  running: boolean
}

type ParticleSimulation = Status & {
  state: ParticleState
  reset: () => void
  toggleRunning: () => void
}

type Options = {
  initialState: ParticleState
  dt: number
  computeAcceleration: (state: ParticleState) => Vector3Like
  runningByDefault?: boolean
  autoResetOnInitialStateChange?: boolean
}

function cloneState(state: ParticleState): ParticleState {
  return {
    position: { ...state.position },
    velocity: { ...state.velocity },
  }
}

export function useParticleSimulation(options: Options): ParticleSimulation {
  const {
    dt,
    computeAcceleration,
    runningByDefault = false,
    autoResetOnInitialStateChange = false,
  } = options
  const initialStateRef = useRef(cloneState(options.initialState))
  const accelerationRef = useRef(computeAcceleration)

  const [state, setState] = useState<ParticleState>(() => cloneState(initialStateRef.current))
  const [status, setStatus] = useState<Status>({
    mode: 'local',
    error: null,
    running: runningByDefault,
  })

  const stepperRef = useRef<SimulationStepper | null>(null)
  const stateRef = useRef(state)

  useEffect(() => {
    accelerationRef.current = computeAcceleration
  }, [computeAcceleration])

  useEffect(() => {
    const fresh = cloneState(options.initialState)
    initialStateRef.current = fresh

    if (autoResetOnInitialStateChange) {
      stateRef.current = fresh
      setState(fresh)
      setStatus((prev) => ({ ...prev, error: null }))
    }
  }, [autoResetOnInitialStateChange, options.initialState])

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    const stepper = createDefaultSimulationStepper()
    stepperRef.current = stepper
    setStatus((prev) => ({ ...prev, mode: stepper.mode }))

    return () => {
      stepper.terminate()
      stepperRef.current = null
    }
  }, [])

  useEffect(() => {
    if (
      !status.running ||
      !stepperRef.current ||
      typeof requestAnimationFrame !== 'function' ||
      typeof cancelAnimationFrame !== 'function'
    ) {
      return
    }

    let cancelled = false
    let frameId = 0

    const loop = async () => {
      if (cancelled || !stepperRef.current) {
        return
      }

      const current = stateRef.current

      try {
        const next = await stepperRef.current.step({
          state: current,
          acceleration: accelerationRef.current(current),
          dt,
        })
        if (cancelled) {
          return
        }
        setState(next)
        setStatus((prev) => ({ ...prev, error: null }))
      } catch (error) {
        if (cancelled) {
          return
        }
        setStatus((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'simulation error',
          running: false,
        }))
        return
      }

      frameId = requestAnimationFrame(loop)
    }

    frameId = requestAnimationFrame(loop)
    return () => {
      cancelled = true
      cancelAnimationFrame(frameId)
    }
  }, [dt, status.running])

  const reset = useCallback(() => {
    const fresh = cloneState(initialStateRef.current)
    stateRef.current = fresh
    setState(fresh)
    setStatus((prev) => ({ ...prev, error: null, running: false }))
  }, [])

  const toggleRunning = useCallback(() => {
    setStatus((prev) => ({ ...prev, running: !prev.running }))
  }, [])

  return useMemo(
    () => ({
      state,
      mode: status.mode,
      error: status.error,
      running: status.running,
      reset,
      toggleRunning,
    }),
    [reset, state, status, toggleRunning],
  )
}
