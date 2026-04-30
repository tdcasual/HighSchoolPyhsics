import { afterEach, describe, expect, it } from 'vitest'
import { DEMO_ROUTES, DISCOVERED_SCENE_PAGE_IDS } from '../demoRoutes'
import { SCENE_CATALOG, findSceneCatalogEntryByPath } from '../sceneCatalog'
import { collectRouteConformanceIssues } from '../routeConformance'
import { useAppStore } from '../../store/useAppStore'

describe('demo route conformance', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/')
    useAppStore.setState({
      activeScenePath: '/',
    })
  })

  it('enforces complete navigation and touch profile metadata for every demo route', () => {
    expect(collectRouteConformanceIssues(DEMO_ROUTES)).toEqual([])
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

  it('reports non-string route metadata as conformance issues instead of throwing', () => {
    const invalidRoute = {
      ...DEMO_ROUTES[0],
      label: 42 as unknown as (typeof DEMO_ROUTES)[number]['label'],
      meta: {
        ...DEMO_ROUTES[0].meta,
        tag: false as unknown as (typeof DEMO_ROUTES)[number]['meta']['tag'],
        summary: { text: 'bad' } as unknown as (typeof DEMO_ROUTES)[number]['meta']['summary'],
        highlights: [42, 'ok'] as unknown as (typeof DEMO_ROUTES)[number]['meta']['highlights'],
        tone: false as unknown as (typeof DEMO_ROUTES)[number]['meta']['tone'],
      },
    }

    expect(collectRouteConformanceIssues([invalidRoute])).toEqual(
      expect.arrayContaining([
        {
          path: invalidRoute.path,
          message: 'label must be a non-blank string',
        },
        {
          path: invalidRoute.path,
          message: 'meta.tag must be a non-blank string',
        },
        {
          path: invalidRoute.path,
          message: 'meta.summary must be a non-blank string',
        },
        {
          path: invalidRoute.path,
          message: 'meta.highlights[0] must be a non-blank string',
        },
        {
          path: invalidRoute.path,
          message: 'meta.tone must be one of scope|cyclotron|mhd|oersted',
        },
      ]),
    )
  })

  it('reports missing route meta objects as conformance issues instead of throwing', () => {
    const invalidRoute = {
      ...DEMO_ROUTES[0],
      meta: null as unknown as (typeof DEMO_ROUTES)[number]['meta'],
    }

    expect(collectRouteConformanceIssues([invalidRoute])).toContainEqual({
      path: invalidRoute.path,
      message: 'meta must be an object with tag, summary, highlights, and tone',
    })
  })

  it('reports malformed touch metadata as conformance issues instead of throwing', () => {
    const invalidRoute = {
      ...DEMO_ROUTES[0],
      touchProfile: {
        ...DEMO_ROUTES[0].touchProfile,
        pageScroll: false as unknown as (typeof DEMO_ROUTES)[number]['touchProfile']['pageScroll'],
        canvasGestureScope: 12 as unknown as (typeof DEMO_ROUTES)[number]['touchProfile']['canvasGestureScope'],
        minTouchTargetPx: '44' as unknown as (typeof DEMO_ROUTES)[number]['touchProfile']['minTouchTargetPx'],
        gestureMatrix: null as unknown as (typeof DEMO_ROUTES)[number]['touchProfile']['gestureMatrix'],
      },
    }

    expect(collectRouteConformanceIssues([invalidRoute])).toEqual(
      expect.arrayContaining([
        {
          path: invalidRoute.path,
          message: 'touchProfile.pageScroll must be vertical-outside-canvas',
        },
        {
          path: invalidRoute.path,
          message: 'touchProfile.canvasGestureScope must be interactive-canvas',
        },
        {
          path: invalidRoute.path,
          message: 'touchProfile.minTouchTargetPx must be a number >= 44',
        },
        {
          path: invalidRoute.path,
          message: 'touchProfile.gestureMatrix must be an object with singleFingerRotate, twoFingerZoom, and twoFingerPan',
        },
      ]),
    )
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
    expect(DEMO_ROUTES.map((route) => route.path)).toEqual(
      expectedPageIds.map((pageId) => `/${pageId}`),
    )
  })

  it('keeps auto-discovered scene modules aligned with the catalog', () => {
    const expectedPageIds = SCENE_CATALOG.map((scene) => scene.pageId).sort()
    expect(DISCOVERED_SCENE_PAGE_IDS).toEqual(expectedPageIds)
  })
})
