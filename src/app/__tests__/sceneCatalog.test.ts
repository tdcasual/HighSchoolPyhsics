import { describe, expect, it } from 'vitest'
import {
  buildSceneCatalog,
  findRuntimeSceneCatalogEntry,
  findSceneCatalogEntryByPath,
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
  })
})
