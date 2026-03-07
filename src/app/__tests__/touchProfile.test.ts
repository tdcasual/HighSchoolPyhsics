import { describe, expect, it } from 'vitest'
import { buildTouchProfileHint, ENHANCED_TOUCH_PROFILE } from '../touchProfile'

describe('touchProfile helpers', () => {
  it('builds the default classroom touch hint from the shared profile', () => {
    expect(buildTouchProfileHint(ENHANCED_TOUCH_PROFILE)).toBe('拖拽旋转 · 滚轮缩放 · 右键平移 · 单指旋转 · 双指缩放/平移')
  })

  it('omits unsupported touch gestures from the hint text', () => {
    expect(
      buildTouchProfileHint({
        ...ENHANCED_TOUCH_PROFILE,
        gestureMatrix: {
          singleFingerRotate: false,
          twoFingerZoom: true,
          twoFingerPan: false,
        },
      }),
    ).toBe('拖拽旋转 · 滚轮缩放 · 右键平移 · 双指缩放')
  })
})
