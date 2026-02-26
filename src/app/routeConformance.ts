import type { DemoRoute } from './demoRoutes'

export type RouteConformanceIssue = {
  path: string
  message: string
}

function isNonBlankText(value: string): boolean {
  return value.trim().length > 0
}

function validateRouteMetadata(route: DemoRoute): RouteConformanceIssue[] {
  const issues: RouteConformanceIssue[] = []

  if (!isNonBlankText(route.label)) {
    issues.push({ path: route.path, message: 'label is required' })
  }

  if (!isNonBlankText(route.meta.tag)) {
    issues.push({ path: route.path, message: 'meta.tag is required' })
  }

  if (!isNonBlankText(route.meta.summary)) {
    issues.push({ path: route.path, message: 'meta.summary is required' })
  }

  if (route.meta.highlights.length < 2) {
    issues.push({ path: route.path, message: 'meta.highlights must provide at least two items' })
  }

  for (const [index, highlight] of route.meta.highlights.entries()) {
    if (!isNonBlankText(highlight)) {
      issues.push({ path: route.path, message: `meta.highlights[${index}] cannot be blank` })
    }
  }

  return issues
}

function validateTouchProfile(route: DemoRoute): RouteConformanceIssue[] {
  const issues: RouteConformanceIssue[] = []
  const profile = route.touchProfile

  if (profile.pageScroll !== 'vertical') {
    issues.push({ path: route.path, message: 'touchProfile.pageScroll must be vertical' })
  }

  if (profile.canvasGestureScope !== 'interactive-canvas') {
    issues.push({ path: route.path, message: 'touchProfile.canvasGestureScope must be interactive-canvas' })
  }

  if (profile.minTouchTargetPx < 44) {
    issues.push({ path: route.path, message: 'touchProfile.minTouchTargetPx must be >= 44' })
  }

  if (!profile.gestureMatrix.singleFingerRotate) {
    issues.push({ path: route.path, message: 'touchProfile.gestureMatrix.singleFingerRotate must be true' })
  }

  if (!profile.gestureMatrix.twoFingerZoom) {
    issues.push({ path: route.path, message: 'touchProfile.gestureMatrix.twoFingerZoom must be true' })
  }

  if (!profile.gestureMatrix.twoFingerPan) {
    issues.push({ path: route.path, message: 'touchProfile.gestureMatrix.twoFingerPan must be true' })
  }

  if (!profile.gestureMatrix.doubleTapReset) {
    issues.push({ path: route.path, message: 'touchProfile.gestureMatrix.doubleTapReset must be true' })
  }

  if (!profile.gestureMatrix.threeFingerModeSwitch) {
    issues.push({ path: route.path, message: 'touchProfile.gestureMatrix.threeFingerModeSwitch must be true' })
  }

  return issues
}

export function collectRouteConformanceIssues(routes: DemoRoute[]): RouteConformanceIssue[] {
  return routes.flatMap((route) => [
    ...validateRouteMetadata(route),
    ...validateTouchProfile(route),
  ])
}
