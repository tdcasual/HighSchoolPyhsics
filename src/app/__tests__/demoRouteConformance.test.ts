import { afterEach, describe, expect, it } from 'vitest'
import { DEMO_ROUTES, DISCOVERED_SCENE_PAGE_IDS } from '../demoRoutes'
import { SCENE_CATALOG, findSceneCatalogEntryByPath } from '../sceneCatalog'
import { SCENE_CARDS } from '../sceneCards'
import { useAppStore } from '../../store/useAppStore'

describe('demo route conformance', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/')
    useAppStore.setState({
      activeScenePath: '/',
    })
  })

  it('gives every scene a label and complete overview card text', () => {
    const blank = (value: unknown) => typeof value !== 'string' || value.trim() === ''
    for (const route of DEMO_ROUTES) {
      const card = SCENE_CARDS.get(route.pageId)
      expect(blank(route.label), route.pageId).toBe(false)
      expect(card, route.pageId).toBeDefined()
      expect([card?.tag, card?.summary, ...(card?.highlights ?? [])].some(blank), route.pageId).toBe(false)
      expect(card?.highlights.length, route.pageId).toBeGreaterThan(0)
      expect(['scope', 'cyclotron', 'mhd', 'oersted'], route.pageId).toContain(card?.tone)
    }
  })

  it('declares the enhanced touch gesture package with minimum 44px target', () => {
    for (const route of DEMO_ROUTES) {
      expect(route.touchProfile.pageScroll).toBe('vertical-outside-canvas')
      expect(route.touchProfile.minTouchTargetPx).toBeGreaterThanOrEqual(44)
      expect(route.touchProfile.gestureMatrix.singleFingerRotate).toBe(true)
      expect(route.touchProfile.gestureMatrix.twoFingerZoom).toBe(true)
      expect(route.touchProfile.gestureMatrix.twoFingerPan).toBe(true)
    }
  })

  it('keeps route touch profiles aligned with the shared catalog source', () => {
    for (const route of DEMO_ROUTES) {
      const catalogEntry = findSceneCatalogEntryByPath(route.path)

      expect(route.touchProfile).toEqual(catalogEntry?.touchProfile)
    }
  })

  it('stays aligned with the shared scene catalog source', () => {
    const expectedPageIds = SCENE_CATALOG.map((scene) => scene.pageId)
    expect(DEMO_ROUTES.map((route) => route.pageId)).toEqual(expectedPageIds)
    expect(DEMO_ROUTES.map((route) => route.path)).toEqual(expectedPageIds.map((pageId) => `/${pageId}`))
  })

  it('keeps auto-discovered scene modules aligned with the catalog', () => {
    const expectedPageIds = SCENE_CATALOG.map((scene) => scene.pageId).sort()
    expect(DISCOVERED_SCENE_PAGE_IDS).toEqual(expectedPageIds)
  })
})
