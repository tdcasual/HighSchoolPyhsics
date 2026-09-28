import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createDefaultSimulationStepper, type SimulationStepper } from '../workers/simClient'
import type { ParticleState, Vector3Like } from './types'

type Mode = 'worker'

type Status = {
  mode: Mode
  error: string | null
  running: boolean
}

type ParticleSimulation = Status & {
  state: ParticleState
  elapsedTimeS: number
  reset: () => void
  toggleRunning: () => void
}

type Options = {
  initialState: ParticleState
  dt: number
  computeAcceleration: (state: ParticleState) => Vector3Like
  computeAccelerationAtTime?: (state: ParticleState, timeS: number, dt: number) => Vector3Like
  shouldStop?: (state: ParticleState) => boolean
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
  const accelerationAtTimeRef = useRef(options.computeAccelerationAtTime)
  const shouldStopRef = useRef(options.shouldStop)

  const [state, setState] = useState<ParticleState>(() => cloneState(initialStateRef.current))
  const [elapsedTimeS, setElapsedTimeS] = useState(0)
  const [status, setStatus] = useState<Status>({
    mode: 'worker',
    error: null,
    running: runningByDefault,
  })

  const stepperRef = useRef<SimulationStepper | null>(null)
  const stateRef = useRef(state)
  const elapsedTimeRef = useRef(0)

  useEffect(() => {
    accelerationRef.current = computeAcceleration
  }, [computeAcceleration])

  useEffect(() => {
    accelerationAtTimeRef.current = options.computeAccelerationAtTime
    shouldStopRef.current = options.shouldStop
  }, [options.computeAccelerationAtTime, options.shouldStop])

  useEffect(() => {
    const fresh = cloneState(options.initialState)
    initialStateRef.current = fresh

    if (autoResetOnInitialStateChange) {
      stateRef.current = fresh
      elapsedTimeRef.current = 0
      setState(fresh)
      setElapsedTimeS(0)
      setStatus((prev) => ({ ...prev, error: null }))
    }
  }, [autoResetOnInitialStateChange, options.initialState])

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    try {
      const stepper = createDefaultSimulationStepper()
      stepperRef.current = stepper
      setStatus((prev) => ({ ...prev, mode: stepper.mode, error: null }))

      return () => {
        stepper.terminate()
        stepperRef.current = null
      }
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'worker initialization error',
        running: false,
      }))
      return
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
    let frameCount = 0

    const loop = async () => {
      if (cancelled || !stepperRef.current) {
        return
      }

      const current = stateRef.current

      try {
        const acceleration = accelerationAtTimeRef.current
          ? accelerationAtTimeRef.current(current, elapsedTimeRef.current, dt)
          : accelerationRef.current(current)
        const next = await stepperRef.current.step({
          state: current,
          acceleration,
          dt,
        })
        if (cancelled) {
          return
        }
        elapsedTimeRef.current += dt
        frameCount++
        const shouldStop = shouldStopRef.current?.(next) ?? false
        if (frameCount % 2 === 0 || shouldStop) {
          setState(next)
          setElapsedTimeS(elapsedTimeRef.current)
        } else {
          stateRef.current = next
        }
        setStatus((prev) => ({ ...prev, error: null }))
        if (shouldStop) {
          setStatus((prev) => ({ ...prev, running: false, error: null }))
          return
        }
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
    elapsedTimeRef.current = 0
    setState(fresh)
    setElapsedTimeS(0)
    setStatus((prev) => ({ ...prev, error: null, running: false }))
  }, [])

  const toggleRunning = useCallback(() => {
    setStatus((prev) => ({ ...prev, running: !prev.running }))
  }, [])

  return useMemo(
    () => ({
      state,
      elapsedTimeS,
      mode: status.mode,
      error: status.error,
      running: status.running,
      reset,
      toggleRunning,
    }),
    [elapsedTimeS, reset, state, status, toggleRunning],
  )
}
