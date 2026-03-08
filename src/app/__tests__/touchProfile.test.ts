import { describe, expect, it } from 'vitest'
import { buildTouchProfileHint, ENHANCED_TOUCH_PROFILE, findRuntimeTouchProfile, findTouchProfileByPath, resolveTouchProfile } from '../touchProfile'
import { findSceneCatalogEntryByPath } from '../sceneCatalog'

describe('touchProfile helpers', () => {
  it('builds the default classroom touch hint from the shared profile', () => {
    expect(buildTouchProfileHint(ENHANCED_TOUCH_PROFILE)).toBe('拖拽旋转 · 滚轮缩放 · 右键平移 · 单指旋转 · 双指缩放/平移')
  })


  it('resolves scene touch profiles from lightweight metadata by path', () => {
    expect(findTouchProfileByPath('/oscilloscope')).toStrictEqual(ENHANCED_TOUCH_PROFILE)
    expect(findTouchProfileByPath('/oscilloscope')).not.toBe(ENHANCED_TOUCH_PROFILE)
    expect(findTouchProfileByPath('/')).toBeNull()
  })


  it('reads the declared catalog touch profile for known scenes', () => {
    expect(findTouchProfileByPath('/oscilloscope')).toEqual(findSceneCatalogEntryByPath('/oscilloscope')?.touchProfile)
  })

  it('prefers current browser path when resolving runtime touch profile', () => {
    window.history.replaceState(null, '', '/oscilloscope')

    expect(findRuntimeTouchProfile('/')).toStrictEqual(ENHANCED_TOUCH_PROFILE)
    expect(findRuntimeTouchProfile('/')).not.toBe(ENHANCED_TOUCH_PROFILE)
  })

  it('falls back to the enhanced profile when touch metadata is malformed', () => {
    expect(
      resolveTouchProfile({
        pageScroll: false,
        canvasGestureScope: 'interactive-canvas',
        minTouchTargetPx: '44',
        gestureMatrix: null,
      }),
    ).toStrictEqual(ENHANCED_TOUCH_PROFILE)
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
