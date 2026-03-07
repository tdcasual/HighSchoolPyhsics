import { describe, expect, it } from 'vitest'
import {
  resolvePresentationDirectorDecision,
  type PresentationDirectorInput,
} from '../presentationDirector'

function createInput(overrides: Partial<PresentationDirectorInput> = {}): PresentationDirectorInput {
  return {
    width: 1920,
    height: 1080,
    presentationMode: true,
    routeMode: 'auto',
    autoSignalScore: 3,
    hasChartSignal: true,
    hasResultSignal: true,
    stickySummaryEnabled: true,
    controlsTopSignalInView: false,
    controlsScrollable: true,
    userInteracting: false,
    manualLayoutLocked: false,
    intentLayout: null,
    moment: 'overview',
    ...overrides,
  }
}

describe('presentationDirector', () => {
  it('uses split sticky summary on 1080p chart scenes when controls overflow and summary is enabled', () => {
    const decision = resolvePresentationDirectorDecision(createInput())

    expect(decision.layoutDecision).toBe('split-sticky-summary')
    expect(decision.summaryMode).toBe('sticky')
  })

  it('emphasizes summary in result moment for viewport teaching scenes', () => {
    const decision = resolvePresentationDirectorDecision(
      createInput({
        autoSignalScore: 1,
        hasChartSignal: false,
        routeMode: 'viewport',
        moment: 'result',
        controlsScrollable: false,
      }),
    )

    expect(decision.layoutDecision).toBe('viewport')
    expect(decision.summaryMode).toBe('emphasis')
  })

  it('honors manual layout lock over automatic layout changes', () => {
    const decision = resolvePresentationDirectorDecision(
      createInput({
        routeMode: 'split',
        manualLayoutLocked: true,
        moment: 'focus',
      }),
    )

    expect(decision.layoutDecision).toBe('split')
  })



  it('allows staged scenes to prefer viewport while auto layout is unlocked', () => {
    const decision = resolvePresentationDirectorDecision(
      createInput({
        autoSignalScore: 3,
        intentLayout: 'viewport',
        hasChartSignal: true,
        moment: 'focus',
      }),
    )

    expect(decision.layoutDecision).toBe('viewport')
  })

  it('freezes layout changes while user interaction is active', () => {
    const decision = resolvePresentationDirectorDecision(
      createInput({
        userInteracting: true,
        autoSignalScore: 1,
        hasChartSignal: false,
      }),
    )

    expect(decision.layoutDecision).toBe('split-sticky-summary')
    expect(decision.summaryMode).toBe('sticky')
  })
})
