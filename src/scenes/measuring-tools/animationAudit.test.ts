import { describe, expect, it } from 'vitest'
import { MICROMETER_PITCH_MM } from './model'
import { caliperPose, micrometerPose } from './pose'
import {
  createMeasuringState,
  easeInOutQuad,
  goToDuration,
  goToReading,
  newQuestion,
  setCaliperX,
  setMicGap,
  stepMotion,
  toggleLock,
} from './state'

describe('measuring-tools animation audit', () => {
  it('uses the reference ease and durations', () => {
    expect(easeInOutQuad(0)).toBe(0)
    expect(easeInOutQuad(0.25)).toBeCloseTo(0.125, 8)
    expect(easeInOutQuad(0.5)).toBeCloseTo(0.5, 8)
    expect(easeInOutQuad(1)).toBe(1)
    expect(goToDuration('caliper', 60)).toBeCloseTo(1.35, 8)
    expect(goToDuration('caliper', 200)).toBe(1.4)
    expect(goToDuration('micrometer', 4)).toBeCloseTo(0.9, 8)
    expect(goToDuration('micrometer', 20)).toBe(2)
  })

  it('eases the caliper frame onto the snapped reading and then holds it', () => {
    const started = goToReading(createMeasuringState(), 30.17)
    expect(started.caliperAnim?.to).toBe(30.15)
    const half = stepMotion(started, (started.caliperAnim?.dur ?? 1) / 2)
    expect(half.caliperX).toBeCloseTo(started.caliperX + (30.15 - started.caliperX) * 0.5, 5)
    const finished = stepMotion(half, (started.caliperAnim?.dur ?? 1) / 2)
    expect(finished.caliperAnim).toBeNull()
    expect(finished.caliperX).toBe(30.15)
    expect(caliperPose({ x: finished.caliperX, exploded: 0, locked: false, mode: 'outer' }).frame[0]).toBe(30.15)
  })

  it('opens the instrument at 2.2 units per second', () => {
    const moving = stepMotion({ ...createMeasuringState(), caliperExplodeTarget: 1 }, 0.1)
    expect(moving.caliperExplode).toBeCloseTo(0.22, 8)
    expect(caliperPose({ x: moving.caliperX, exploded: moving.caliperExplode, locked: false, mode: 'outer' }).frame[2]).toBeCloseTo(6.6, 6)
  })

  it('refuses to move a locked jaw and clicks when the fine thimble seats', () => {
    const locked = toggleLock(createMeasuringState())
    expect(setCaliperX(locked, 40).caliperX).toBe(locked.caliperX)
    const seated = setMicGap(createMeasuringState(), 0, 'fine')
    expect(seated.micClick).toBe(1)
    expect(stepMotion(seated, 0.5).micClick).toBeCloseTo(0.7, 8)
  })

  it('turns the thimble by the travelled gap divided by the 0.5 mm pitch', () => {
    const started = goToReading({ ...createMeasuringState(), tool: 'micrometer', micGap: 1, micZero: 0 }, 2)
    expect(started.notice).toContain('2.0 圈')
    const done = stepMotion(started, started.micAnim?.dur ?? 1)
    const pose = micrometerPose({ gap: done.micGap, zero: 0, exploded: 0, locked: false })
    expect(done.micGap).toBeCloseTo(2, 6)
    expect(pose.thimbleRotationX).toBeCloseTo((2 * Math.PI * 2) / MICROMETER_PITCH_MM, 6)
  })

  it('draws a read-practice question without animating the previous reading away', () => {
    const asked = newQuestion(
      { ...createMeasuringState(), lesson: 'read', caliperX: 10 },
      () => 0,
    )
    expect(asked.caliperAnim).toBeNull()
    expect(asked.caliperX).not.toBe(10)
    expect(asked.notice).toContain('新工件')
  })
})
