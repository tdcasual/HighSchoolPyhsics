// Kept free of imports so vite.config.ts can read it when slimming the scene catalog.
export const ENHANCED_TOUCH_PROFILE = {
  pageScroll: 'vertical-outside-canvas',
  canvasGestureScope: 'interactive-canvas',
  minTouchTargetPx: 44,
  gestureMatrix: {
    singleFingerRotate: true,
    twoFingerZoom: true,
    twoFingerPan: true,
  },
} as const
