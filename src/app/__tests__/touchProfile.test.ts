import { describe, expect, it } from 'vitest'
import { buildTouchProfileHint, ENHANCED_TOUCH_PROFILE, findRuntimeTouchProfile, findTouchProfileByPath } from '../touchProfile'

describe('touchProfile helpers', () => {
  it('builds the default classroom touch hint from the shared profile', () => {
    expect(buildTouchProfileHint(ENHANCED_TOUCH_PROFILE)).toBe('拖拽旋转 · 滚轮缩放 · 右键平移 · 单指旋转 · 双指缩放/平移')
  })


  it('resolves scene touch profiles from lightweight metadata by path', () => {
    expect(findTouchProfileByPath('/oscilloscope')).toBe(ENHANCED_TOUCH_PROFILE)
    expect(findTouchProfileByPath('/')).toBeNull()
  })

  it('prefers current browser path when resolving runtime touch profile', () => {
    window.history.replaceState(null, '', '/oscilloscope')

    expect(findRuntimeTouchProfile('/')).toBe(ENHANCED_TOUCH_PROFILE)
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
