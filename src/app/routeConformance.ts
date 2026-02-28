import type { DemoRoute } from './demoRoutes'
import { scorePresentationSignals } from '../ui/layout/presentationSignals'

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

  if (typeof route.preload !== 'function') {
    issues.push({ path: route.path, message: 'preload is required' })
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

  if (profile.pageScroll !== 'vertical-outside-canvas') {
    issues.push({
      path: route.path,
      message: 'touchProfile.pageScroll must be vertical-outside-canvas',
    })
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

function validateClassroomContract(route: DemoRoute): RouteConformanceIssue[] {
  const issues: RouteConformanceIssue[] = []
  const { classroom } = route
  const signals = classroom.presentationSignals

  if (signals.length === 0) {
    issues.push({
      path: route.path,
      message: 'classroom.presentationSignals must declare at least one signal',
    })
  }

  if (new Set(signals).size !== signals.length) {
    issues.push({
      path: route.path,
      message: 'classroom.presentationSignals cannot contain duplicates',
    })
  }

  if (scorePresentationSignals(signals) < 1) {
    issues.push({
      path: route.path,
      message: 'classroom.presentationSignals score must be >= 1',
    })
  }

  if (classroom.coreSummaryLineCount < 3 || classroom.coreSummaryLineCount > 5) {
    issues.push({
      path: route.path,
      message: 'classroom.coreSummaryLineCount must be between 3 and 5',
    })
  }

  return issues
}

function validateRouteIdentity(routes: DemoRoute[]): RouteConformanceIssue[] {
  const issues: RouteConformanceIssue[] = []
  const seenPageIds = new Set<string>()
  const seenPaths = new Set<string>()
  const seenLabels = new Set<string>()
  const pageIdPattern = /^[a-z][a-z0-9-]*$/
  const pathPattern = /^\/[a-z][a-z0-9-]*$/

  for (const route of routes) {
    if (!pageIdPattern.test(route.pageId)) {
      issues.push({
        path: route.path,
        message: 'pageId must match ^[a-z][a-z0-9-]*$',
      })
    }

    if (!pathPattern.test(route.path)) {
      issues.push({
        path: route.path,
        message: 'path must match ^/[a-z][a-z0-9-]*$',
      })
    }

    if (route.path !== `/${route.pageId}`) {
      issues.push({
        path: route.path,
        message: 'path must be derived from pageId ("/" + pageId)',
      })
    }

    if (seenPageIds.has(route.pageId)) {
      issues.push({
        path: route.path,
        message: `duplicate pageId detected: ${route.pageId}`,
      })
    }
    seenPageIds.add(route.pageId)

    if (seenPaths.has(route.path)) {
      issues.push({
        path: route.path,
        message: `duplicate path detected: ${route.path}`,
      })
    }
    seenPaths.add(route.path)

    if (seenLabels.has(route.label)) {
      issues.push({
        path: route.path,
        message: `duplicate label detected: ${route.label}`,
      })
    }
    seenLabels.add(route.label)
  }

  return issues
}

export function collectRouteConformanceIssues(routes: DemoRoute[]): RouteConformanceIssue[] {
  return [
    ...validateRouteIdentity(routes),
    ...routes.flatMap((route) => [
      ...validateRouteMetadata(route),
      ...validateTouchProfile(route),
      ...validateClassroomContract(route),
    ]),
  ]
}
