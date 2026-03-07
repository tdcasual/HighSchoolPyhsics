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
