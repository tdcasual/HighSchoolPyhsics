import { describe, expect, it } from 'vitest'
import { DEMO_ROUTES } from '../demoRoutes'
import { scorePresentationSignals } from '../../ui/layout/presentationSignals'
import { collectRouteConformanceIssues } from '../routeConformance'

describe('demo route conformance', () => {
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
      expect(route.touchProfile.gestureMatrix.doubleTapReset).toBe(true)
      expect(route.touchProfile.gestureMatrix.threeFingerModeSwitch).toBe(true)
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
    }
  })
})
