import { Suspense, createElement } from 'react'
import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import sceneCatalog from '../../../config/demo-scenes.json'
import { DEMO_ROUTES, DISCOVERED_SCENE_PAGE_IDS } from '../demoRoutes'
import { findSceneCatalogEntryByPath } from '../sceneCatalog'
import { scorePresentationSignals } from '../../ui/layout/presentationSignals'
import { collectRouteConformanceIssues } from '../routeConformance'
import { useAppStore } from '../../store/useAppStore'

function setViewportSize(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  })
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    writable: true,
    value: height,
  })
  window.dispatchEvent(new Event('resize'))
}

function countRenderedCoreSummaryLines(summary: HTMLElement): number {
  const summaryLines = summary.querySelectorAll('.scene-core-summary-stack > p')
  if (summaryLines.length > 0) {
    return summaryLines.length
  }

  return summary.querySelectorAll('p').length
}

describe('demo route conformance', () => {
  beforeEach(() => {
    setViewportSize(1920, 1080)
  })

  afterEach(() => {
    window.history.replaceState(null, '', '/')
    useAppStore.setState({
      presentationMode: false,
      presentationRouteModes: {},
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

  it('declares classroom contract for every route with teach-critical fallback size', () => {
    for (const route of DEMO_ROUTES) {
      expect(route.pageId).toMatch(/^[a-z][a-z0-9-]*$/)
      expect(route.path).toBe(`/${route.pageId}`)
      expect(route.classroom.presentationSignals.length).toBeGreaterThan(0)
      expect(scorePresentationSignals(route.classroom.presentationSignals)).toBeGreaterThanOrEqual(1)
      expect(route.classroom.coreSummaryLineCount).toBeGreaterThanOrEqual(3)
      expect(route.classroom.coreSummaryLineCount).toBeLessThanOrEqual(5)
      expect(route.classroom.sceneKind).toMatch(/^(trajectory|field|structure|process)$/)
      expect(route.classroom.smartPresentation.layout).toMatch(/^(never|enter-only|staged)$/)
      expect(typeof route.classroom.smartPresentation.focus).toBe('boolean')
      expect(typeof route.classroom.smartPresentation.stickySummary).toBe('boolean')
    }
  })

  it('matches each catalog core summary line count to the rendered classroom summary', async () => {
    for (const route of DEMO_ROUTES) {
      window.history.replaceState(null, '', route.path)
      useAppStore.setState({
        presentationMode: true,
        presentationRouteModes: { [route.path]: 'viewport' },
        activeScenePath: route.path,
      })

      await route.preload()

      const { unmount } = render(
        createElement(
          Suspense,
          { fallback: createElement('p', null, 'loading') },
          createElement(route.Component),
        ),
      )

      const summary = await screen.findByRole('region', { name: '课堂核心信息' })
      expect(
        countRenderedCoreSummaryLines(summary),
        `${route.pageId} rendered coreSummary should match catalog line count`,
      ).toBe(route.classroom.coreSummaryLineCount)

      unmount()
    }
  })

  it('stays aligned with the shared scene catalog source', () => {
    const expectedPageIds = sceneCatalog.map((scene) => scene.pageId)
    expect(DEMO_ROUTES.map((route) => route.pageId)).toEqual(expectedPageIds)
    expect(DEMO_ROUTES.map((route) => route.path)).toEqual(
      expectedPageIds.map((pageId) => `/${pageId}`),
    )
  })

  it('exposes shared classroom contract lookup by normalized route path', () => {
    const potential = findSceneCatalogEntryByPath('/potential-energy/')
    expect(potential?.classroom.smartPresentation.layout).toBe('staged')
    expect(potential?.classroom.smartPresentation.focus).toBe(true)

    const oscilloscope = findSceneCatalogEntryByPath('/oscilloscope')
    expect(oscilloscope?.classroom.smartPresentation.stickySummary).toBe(false)
  })

  it('keeps auto-discovered scene modules aligned with the catalog', () => {
    const expectedPageIds = sceneCatalog.map((scene) => scene.pageId).sort()
    expect(DISCOVERED_SCENE_PAGE_IDS).toEqual(expectedPageIds)
  })
})
