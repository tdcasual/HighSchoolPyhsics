import { describe, expect, it } from 'vitest'
import { DURATION, dots, hookAcceleration } from './model'
import {
  advanceCart,
  applyPreset,
  assemblyMove,
  compareAll,
  createCartState,
  runFit,
  setHooks,
  stepCart,
} from './state'

describe('cart acceptance', () => {
  it('steps one dot interval and saves the run when the tape is full', () => {
    const stepped = stepCart(createCartState())
    expect(stepped.time).toBeCloseTo(0.02, 12)
    expect(stepped.running).toBe(false)
    expect(dots(stepped.time, { a: hookAcceleration(3), v0: 0.1 })).toHaveLength(2)
    const finished = advanceCart({ ...createCartState(), running: true }, DURATION)
    expect(finished.time).toBe(DURATION)
    expect(finished.running).toBe(false)
    expect(finished.runs).toHaveLength(1)
    expect(runFit(finished.runs[0], 5)?.a).toBeCloseTo(hookAcceleration(3), 8)
  })

  it('resets the tape when the hook count changes and can compare every count', () => {
    const moving = stepCart(createCartState())
    const cleared = setHooks(moving, 0)
    expect(cleared.time).toBe(0)
    expect(cleared.hooks).toBe(0)
    const compared = compareAll(createCartState())
    expect(compared.runs.map((run) => run.hooks)).toEqual([1, 2, 3, 4, 5])
    expect(applyPreset(compared, 'uniform')).toMatchObject({ hooks: 0, v0: 0.2, time: 0, runs: compared.runs })
  })

  it('keeps the cart still until the pulley is installed', () => {
    const assembling = { ...createCartState(), stage: 'assemble' as const, assembly: 0 }
    expect(stepCart(assembling).time).toBe(0)
    const ready = assemblyMove({ ...assembling, assembly: 5 }, 1)
    expect(ready.stage).toBe('run')
    expect(stepCart(ready).time).toBeCloseTo(0.02, 12)
  })
})
