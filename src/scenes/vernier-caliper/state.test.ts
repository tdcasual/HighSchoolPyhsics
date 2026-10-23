import { describe, expect, it } from 'vitest'
import { caliperPose } from '../../instruments/measuring/pose'
import { setLesson, shouldShowSpecimen, toggleLock } from '../../instruments/measuring/practice'
import { createCaliperState, goToReading, newQuestion, setPosition, stepMotion } from './state'

const lock = { locked: '', unlocked: '' }

describe('vernier caliper state', () => {
  it('eases the frame onto the snapped reading and then holds it', () => {
    const started = goToReading(createCaliperState(), 30.17)
    expect(started.anim?.to).toBe(30.15)
    const half = stepMotion(started, (started.anim?.dur ?? 1) / 2)
    expect(half.position).toBeCloseTo(started.position + (30.15 - started.position) * 0.5, 5)
    const finished = stepMotion(half, (started.anim?.dur ?? 1) / 2)
    expect(finished.anim).toBeNull()
    expect(finished.position).toBe(30.15)
    expect(caliperPose({ x: finished.position, exploded: 0, locked: false, mode: 'outer' }).frame[0]).toBe(30.15)
  })

  it('opens the instrument at 2.2 units per second', () => {
    const moving = stepMotion({ ...createCaliperState(), explodeTarget: 1 }, 0.1)
    expect(moving.explode).toBeCloseTo(0.22, 8)
    expect(
      caliperPose({ x: moving.position, exploded: moving.explode, locked: false, mode: 'outer' }).frame[2],
    ).toBeCloseTo(4.84, 6)
  })

  it('refuses to move a locked frame', () => {
    const locked = toggleLock(createCaliperState(), lock)
    expect(setPosition(locked, 40).position).toBe(locked.position)
  })

  it('only shows a specimen after issuing a read-practice question', () => {
    const readMode = setLesson(createCaliperState(), 'read')
    expect(shouldShowSpecimen(readMode)).toBe(false)
    expect(shouldShowSpecimen(newQuestion(readMode, () => 0))).toBe(true)
    expect(shouldShowSpecimen(newQuestion(setLesson(createCaliperState(), 'adjust'), () => 0))).toBe(false)
  })

  it('draws a read question without animating the previous reading away, on the scale view', () => {
    const asked = newQuestion({ ...createCaliperState(), lesson: 'read', position: 10 }, () => 0)
    expect(asked.anim).toBeNull()
    expect(asked.position).not.toBe(10)
    expect(asked.workSize).toBe(asked.position)
    expect(asked.view).toBe('focus')
    expect(asked.notice).toContain('新工件')
  })

  it('keeps the specimen fixed while the frame is adjusted', () => {
    const question = newQuestion({ ...createCaliperState(), lesson: 'read' }, () => 0)
    expect(setPosition(question, question.position + 5).workSize).toBe(question.workSize)
  })
})
