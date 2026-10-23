import { describe, expect, it } from 'vitest'
import { runFixedSteps } from './fixedSteps'

describe('runFixedSteps', () => {
  it('spends whole sub-steps and carries the remainder to the next frame', () => {
    const steps: number[] = []
    const first = runFixedSteps(0, 0.025, 0.01, (dt) => void steps.push(dt))
    expect(steps).toEqual([0.01, 0.01])
    expect(first.carry).toBeCloseTo(0.005)
    runFixedSteps(first.carry, 0.005, 0.01, (dt) => void steps.push(dt))
    expect(steps).toHaveLength(3)
  })

  it('stops and drops the carry once the process ends', () => {
    let calls = 0
    const result = runFixedSteps(0, 0.05, 0.01, () => ++calls < 2)
    expect(calls).toBe(2)
    expect(result).toEqual({ carry: 0, ended: true })
  })
})
