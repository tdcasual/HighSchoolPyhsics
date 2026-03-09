import { describe, expect, it } from 'vitest'
import {
  buildSceneCatalog,
  canUseRuntimePreferredLayout,
  findRuntimeSceneCatalogEntry,
  findSceneCatalogEntryByPath,
  resolveClassroomSceneKind,
  resolveClassroomSmartPresentation,
  resolveSceneKindMinimumAutoSignalScore,
  resolveSmartFocusEnabled,
  resolveSmartStickySummaryPreference,
} from '../sceneCatalog'

describe('sceneCatalog classroom semantics', () => {
  it('throws a descriptive error when a scene catalog entry is malformed', () => {
    expect(() => buildSceneCatalog([null])).toThrow(/sceneCatalog\[0\] must be an object/i)
  })

  it('throws a descriptive error when a scene catalog entry pageId is malformed', () => {
    expect(() =>
      buildSceneCatalog([
        {
          pageId: 42,
        },
      ]),
    ).toThrow(/sceneCatalog\[0\]\.pageId must be a non-blank string/i)
  })

  it('throws a descriptive error when scene catalog pageIds are duplicated', () => {
    expect(() =>
      buildSceneCatalog([
        { pageId: 'oscilloscope' },
        { pageId: 'oscilloscope' },
      ]),
    ).toThrow(/duplicate sceneCatalog pageId "oscilloscope" at index 1/i)
  })

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

  it('falls back to safe defaults when smart presentation booleans are malformed', () => {
    expect(
      resolveSmartFocusEnabled({
        layout: 'staged',
        focus: 'false' as unknown as boolean,
        stickySummary: true,
      }),
    ).toBe(true)

    expect(
      resolveSmartStickySummaryPreference(
        {
          layout: 'staged',
          focus: true,
          stickySummary: 'false' as unknown as boolean,
        },
        true,
      ),
    ).toBe(true)
  })

  it('resolves classroom sceneKind and smart presentation only from valid classroom objects', () => {
    expect(resolveClassroomSceneKind({ sceneKind: 'field' })).toBe('field')
    expect(resolveClassroomSceneKind(null)).toBeNull()
    expect(resolveClassroomSceneKind({ sceneKind: 'vector' })).toBeNull()

    expect(
      resolveClassroomSmartPresentation({
        smartPresentation: { layout: 'staged', focus: true, stickySummary: false },
      }),
    ).toEqual({ layout: 'staged', focus: true, stickySummary: false })
    expect(resolveClassroomSmartPresentation({ smartPresentation: null })).toBeNull()
    expect(
      resolveClassroomSmartPresentation({
        smartPresentation: { layout: 'staged', focus: 'true', stickySummary: false },
      }),
    ).toBeNull()
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

  it('returns null for malformed scene catalog lookup paths instead of throwing', () => {
    expect(() => findSceneCatalogEntryByPath({ broken: 'path' } as unknown as string)).not.toThrow()
    expect(findSceneCatalogEntryByPath({ broken: 'path' } as unknown as string)).toBeNull()
  })

  it('prefers current browser path over stale activeScenePath when resolving runtime contract', () => {
    window.history.replaceState(null, '', '/oscilloscope')

    const entry = findRuntimeSceneCatalogEntry('/')

    expect(entry?.pageId).toBe('oscilloscope')
    expect(entry?.classroom.smartPresentation.stickySummary).toBe(false)
  })
})
