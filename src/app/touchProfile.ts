import { findSceneCatalogEntryByPath } from './sceneCatalog'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export type TouchGestureMatrix = {
  singleFingerRotate: boolean
  twoFingerZoom: boolean
  twoFingerPan: boolean
}

export type TouchProfile = {
  pageScroll: 'vertical-outside-canvas'
  canvasGestureScope: 'interactive-canvas'
  minTouchTargetPx: number
  gestureMatrix: TouchGestureMatrix
}

export const ENHANCED_TOUCH_PROFILE: TouchProfile = {
  pageScroll: 'vertical-outside-canvas',
  canvasGestureScope: 'interactive-canvas',
  minTouchTargetPx: 44,
  gestureMatrix: {
    singleFingerRotate: true,
    twoFingerZoom: true,
    twoFingerPan: true,
  },
}

export function resolveTouchProfile(profile: unknown, fallback: TouchProfile = ENHANCED_TOUCH_PROFILE): TouchProfile {
  const fallbackGestureMatrix = {
    ...fallback.gestureMatrix,
  }

  if (!isRecord(profile)) {
    return {
      ...fallback,
      gestureMatrix: fallbackGestureMatrix,
    }
  }

  const gestureMatrix = isRecord(profile.gestureMatrix) ? profile.gestureMatrix : null

  return {
    pageScroll: profile.pageScroll === 'vertical-outside-canvas' ? profile.pageScroll : fallback.pageScroll,
    canvasGestureScope:
      profile.canvasGestureScope === 'interactive-canvas' ? profile.canvasGestureScope : fallback.canvasGestureScope,
    minTouchTargetPx:
      typeof profile.minTouchTargetPx === 'number' && profile.minTouchTargetPx >= 44
        ? profile.minTouchTargetPx
        : fallback.minTouchTargetPx,
    gestureMatrix: {
      singleFingerRotate: gestureMatrix?.singleFingerRotate === true ? true : fallbackGestureMatrix.singleFingerRotate,
      twoFingerZoom: gestureMatrix?.twoFingerZoom === true ? true : fallbackGestureMatrix.twoFingerZoom,
      twoFingerPan: gestureMatrix?.twoFingerPan === true ? true : fallbackGestureMatrix.twoFingerPan,
    },
  }
}

export function buildTouchProfileHint(profile: TouchProfile): string {
  const touchFragments: string[] = []

  if (profile.gestureMatrix.singleFingerRotate) {
    touchFragments.push('单指旋转')
  }

  if (profile.gestureMatrix.twoFingerZoom && profile.gestureMatrix.twoFingerPan) {
    touchFragments.push('双指缩放/平移')
  } else {
    if (profile.gestureMatrix.twoFingerZoom) {
      touchFragments.push('双指缩放')
    }
    if (profile.gestureMatrix.twoFingerPan) {
      touchFragments.push('双指平移')
    }
  }

  return ['拖拽旋转', '滚轮缩放', '右键平移', ...touchFragments].join(' · ')
}

export function resolveTouchTargetMinSize(profile: TouchProfile): string {
  return `${profile.minTouchTargetPx}px`
}

export function findTouchProfileByPath(pathname: string): TouchProfile | null {
  const entry = findSceneCatalogEntryByPath(pathname)
  if (!entry) {
    return null
  }

  return resolveTouchProfile(entry.touchProfile)
}

export function findRuntimeTouchProfile(activeScenePath: string): TouchProfile | null {
  if (typeof window !== 'undefined') {
    return findTouchProfileByPath(window.location.pathname)
  }

  return findTouchProfileByPath(activeScenePath)
}
