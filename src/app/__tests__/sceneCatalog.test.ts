import { describe, expect, it } from 'vitest'
import {
  canUseRuntimePreferredLayout,
  findRuntimeSceneCatalogEntry,
  findSceneCatalogEntryByPath,
  resolveSceneKindMinimumAutoSignalScore,
  resolveSmartFocusEnabled,
  resolveSmartStickySummaryPreference,
} from '../sceneCatalog'

describe('sceneCatalog classroom semantics', () => {
  it('allows runtime preferred layout only for staged scenes', () => {
    expect(canUseRuntimePreferredLayout({ layout: 'staged', focus: true, stickySummary: true })).toBe(true)
    expect(canUseRuntimePreferredLayout({ layout: 'enter-only', focus: true, stickySummary: true })).toBe(false)
    expect(canUseRuntimePreferredLayout({ layout: 'never', focus: false, stickySummary: false })).toBe(false)
  })

  it('resolves focus and sticky summary booleans from smart presentation contract', () => {
    expect(resolveSmartFocusEnabled({ layout: 'never', focus: false, stickySummary: false })).toBe(false)
    expect(resolveSmartFocusEnabled(undefined)).toBe(true)
    expect(resolveSmartStickySummaryPreference({ layout: 'enter-only', focus: true, stickySummary: false }, true)).toBe(false)
    expect(resolveSmartStickySummaryPreference(undefined, true)).toBe(true)
  })


  it('resolves sceneKind fallback scores for classroom auto layout', () => {
    expect(resolveSceneKindMinimumAutoSignalScore('trajectory')).toBe(2)
    expect(resolveSceneKindMinimumAutoSignalScore('field')).toBe(2)
    expect(resolveSceneKindMinimumAutoSignalScore('structure')).toBe(1)
    expect(resolveSceneKindMinimumAutoSignalScore('process')).toBe(1)
    expect(resolveSceneKindMinimumAutoSignalScore(undefined)).toBe(0)
  })


  it('exposes touch profile metadata from the shared catalog lookup', () => {
    const entry = findSceneCatalogEntryByPath('/oscilloscope')

    expect(entry?.touchProfile.pageScroll).toBe('vertical-outside-canvas')
    expect(entry?.touchProfile.canvasGestureScope).toBe('interactive-canvas')
    expect(entry?.touchProfile.minTouchTargetPx).toBeGreaterThanOrEqual(44)
  })

  it('prefers current browser path over stale activeScenePath when resolving runtime contract', () => {
    window.history.replaceState(null, '', '/oscilloscope')

    const entry = findRuntimeSceneCatalogEntry('/')

    expect(entry?.pageId).toBe('oscilloscope')
    expect(entry?.classroom.smartPresentation.stickySummary).toBe(false)
  })
})
