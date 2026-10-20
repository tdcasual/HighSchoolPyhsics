import { describe, expect, it } from 'vitest'
import { createPracticeState, easeInOutQuad, goToDuration, setLesson, setView, startQuestion, type PracticeState } from './practice'

const fresh = (): PracticeState => createPracticeState(10, '')

describe('instrument practice flow', () => {
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

  it('opens questions on the scale close-up and restores the teacher view afterwards', () => {
    let state = setLesson(setView(fresh(), 'top'), 'read')
    state = startQuestion(state, {})
    expect(state.view).toBe('focus')
    // A second question keeps whatever view the class is using now.
    state = startQuestion(setView(state, 'front'), {})
    expect(state.view).toBe('front')
    state = setLesson(state, 'free')
    expect(state.view).toBe('top')
    expect(state.viewBeforePractice).toBeNull()
  })
})
