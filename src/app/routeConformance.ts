import type { DemoRoute } from './demoRoutes'

type RouteConformanceIssue = {
  path: string
  message: string
}

function isNonBlankText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function validateRouteMetadata(route: DemoRoute): RouteConformanceIssue[] {
  const issues: RouteConformanceIssue[] = []

  if (!isNonBlankText(route.label)) {
    issues.push({ path: route.path, message: 'label must be a non-blank string' })
  }

  const meta = isRecord(route.meta) ? route.meta : null

  if (!meta) {
    issues.push({ path: route.path, message: 'meta must be an object with tag, summary, highlights, and tone' })
  } else {
    if (!isNonBlankText(meta.tag)) {
      issues.push({ path: route.path, message: 'meta.tag must be a non-blank string' })
    }

    if (!isNonBlankText(meta.summary)) {
      issues.push({ path: route.path, message: 'meta.summary must be a non-blank string' })
    }

    const highlights = Array.isArray(meta.highlights) ? meta.highlights : null

    if (!highlights) {
      issues.push({ path: route.path, message: 'meta.highlights must be an array of non-blank strings' })
    } else {
      if (highlights.length < 2) {
        issues.push({ path: route.path, message: 'meta.highlights must provide at least two items' })
      }

      for (const [index, highlight] of highlights.entries()) {
        if (!isNonBlankText(highlight)) {
          issues.push({ path: route.path, message: `meta.highlights[${index}] must be a non-blank string` })
        }
      }
    }

    if (typeof meta.tone !== 'string' || !['scope', 'cyclotron', 'mhd', 'oersted'].includes(meta.tone)) {
      issues.push({ path: route.path, message: 'meta.tone must be one of scope|cyclotron|mhd|oersted' })
    }
  }

  if (typeof route.preload !== 'function') {
    issues.push({ path: route.path, message: 'preload is required' })
  }

  return issues
}

function validateTouchProfile(route: DemoRoute): RouteConformanceIssue[] {
  const issues: RouteConformanceIssue[] = []
  const profile = isRecord(route.touchProfile) ? route.touchProfile : null

  if (!profile) {
    issues.push({
      path: route.path,
      message: 'touchProfile must be an object',
    })
    return issues
  }

  if (profile.pageScroll !== 'vertical-outside-canvas') {
    issues.push({
      path: route.path,
      message: 'touchProfile.pageScroll must be vertical-outside-canvas',
    })
  }

  if (profile.canvasGestureScope !== 'interactive-canvas') {
    issues.push({ path: route.path, message: 'touchProfile.canvasGestureScope must be interactive-canvas' })
  }

  if (typeof profile.minTouchTargetPx !== 'number' || profile.minTouchTargetPx < 44) {
    issues.push({ path: route.path, message: 'touchProfile.minTouchTargetPx must be a number >= 44' })
  }

  const gestureMatrix = isRecord(profile.gestureMatrix) ? profile.gestureMatrix : null

  if (!gestureMatrix) {
    issues.push({
      path: route.path,
      message: 'touchProfile.gestureMatrix must be an object with singleFingerRotate, twoFingerZoom, and twoFingerPan',
    })
    return issues
  }

  if (gestureMatrix.singleFingerRotate !== true) {
    issues.push({ path: route.path, message: 'touchProfile.gestureMatrix.singleFingerRotate must be true' })
  }

  if (gestureMatrix.twoFingerZoom !== true) {
    issues.push({ path: route.path, message: 'touchProfile.gestureMatrix.twoFingerZoom must be true' })
  }

  if (gestureMatrix.twoFingerPan !== true) {
    issues.push({ path: route.path, message: 'touchProfile.gestureMatrix.twoFingerPan must be true' })
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
    ]),
  ]
}
