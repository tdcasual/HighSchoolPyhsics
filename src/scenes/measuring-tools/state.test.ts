import { describe, expect, it } from 'vitest'
import { createMeasuringState, newQuestion, setLesson, setView } from './state'

const rng = () => 0.37

describe('practice view', () => {
  it('opens questions on the scale close-up and restores the teacher view afterwards', () => {
    let state = setView(createMeasuringState(), 'top')
    state = setLesson(state, 'read')
    state = newQuestion(state, rng)
    expect(state.view).toBe('focus')
    // A second question keeps whatever view the class is using now.
    state = setView(state, 'front')
    state = newQuestion(state, rng)
    expect(state.view).toBe('front')
    state = setLesson(state, 'free')
    expect(state.view).toBe('top')
    expect(state.viewBeforePractice).toBeNull()
  })

  it('does the same for adjustment practice', () => {
    let state = setLesson(createMeasuringState(), 'adjust')
    state = newQuestion(state, rng)
    expect(state.view).toBe('focus')
    expect(setLesson(state, 'free').view).toBe('home')
  })
})
