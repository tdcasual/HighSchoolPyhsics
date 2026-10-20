import { describe, expect, it } from 'vitest'
import { MICROMETER_PITCH_MM } from '../../instruments/measuring/model'
import { micrometerPose } from '../../instruments/measuring/pose'
import { createMicrometerState, goToReading, newQuestion, setGap, stepMotion } from './state'

describe('micrometer state', () => {
  it('clicks when the fine thimble seats on the anvil, then the click fades', () => {
    const seated = setGap(createMicrometerState(), 0, 'fine')
    expect(seated.click).toBe(1)
    expect(stepMotion(seated, 0.5).click).toBeCloseTo(0.7, 8)
  })

  it('turns the thimble by the travelled gap divided by the 0.5 mm pitch', () => {
    const started = goToReading({ ...createMicrometerState(), position: 1, zero: 0 }, 2)
    expect(started.notice).toContain('2.0 圈')
    const done = stepMotion(started, started.anim?.dur ?? 1)
    const pose = micrometerPose({ gap: done.position, zero: 0, exploded: 0, locked: false })
    expect(done.position).toBeCloseTo(2, 6)
    expect(pose.thimbleRotationX).toBeCloseTo((2 * Math.PI * 2) / MICROMETER_PITCH_MM, 6)
  })

  it('keeps the specimen fixed while the thimble is turned', () => {
    const question = newQuestion({ ...createMicrometerState(), lesson: 'read' }, () => 0)
    expect(question.workSize).toBe(question.position)
    expect(setGap(question, question.position + 0.1).workSize).toBe(question.workSize)
  })

  it('reads the zero error into the indicated value of a question', () => {
    const question = newQuestion({ ...createMicrometerState(), lesson: 'read', zero: 0.02 }, () => 0.9)
    expect(question.position + question.zero).toBeGreaterThan(0.25)
  })
})
