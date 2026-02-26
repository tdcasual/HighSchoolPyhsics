import { describe, expect, it } from 'vitest'
import { DEMO_ROUTES } from '../demoRoutes'
import { collectRouteConformanceIssues } from '../routeConformance'

describe('demo route conformance', () => {
  it('enforces complete navigation and touch profile metadata for every demo route', () => {
    expect(collectRouteConformanceIssues(DEMO_ROUTES)).toEqual([])
  })

  it('declares the enhanced touch gesture package with minimum 44px target', () => {
    for (const route of DEMO_ROUTES) {
      expect(route.touchProfile.minTouchTargetPx).toBeGreaterThanOrEqual(44)
      expect(route.touchProfile.gestureMatrix.singleFingerRotate).toBe(true)
      expect(route.touchProfile.gestureMatrix.twoFingerZoom).toBe(true)
      expect(route.touchProfile.gestureMatrix.twoFingerPan).toBe(true)
      expect(route.touchProfile.gestureMatrix.doubleTapReset).toBe(true)
      expect(route.touchProfile.gestureMatrix.threeFingerModeSwitch).toBe(true)
    }
  })
})
