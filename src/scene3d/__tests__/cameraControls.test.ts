import { describe, expect, it } from 'vitest'
import { MOUSE, TOUCH } from 'three'
import { DEMO_ORBIT_CONTROLS } from '../cameraControls'

describe('demo orbit controls policy', () => {
  it('enables rotate and zoom for all demos by default', () => {
    expect(DEMO_ORBIT_CONTROLS.enableRotate).toBe(true)
    expect(DEMO_ORBIT_CONTROLS.enableZoom).toBe(true)
  })

  it('keeps pan enabled for structural inspection', () => {
    expect(DEMO_ORBIT_CONTROLS.enablePan).toBe(true)
  })

  it('uses gentle zoom speed to avoid over-aggressive wheel scaling', () => {
    expect(DEMO_ORBIT_CONTROLS.zoomSpeed).toBeLessThanOrEqual(0.35)
  })

  it('maps touch and mouse gestures to explicit camera semantics', () => {
    expect(DEMO_ORBIT_CONTROLS.mouseButtons.LEFT).toBe(MOUSE.ROTATE)
    expect(DEMO_ORBIT_CONTROLS.mouseButtons.RIGHT).toBe(MOUSE.PAN)
    expect(DEMO_ORBIT_CONTROLS.touches.ONE).toBe(TOUCH.ROTATE)
    expect(DEMO_ORBIT_CONTROLS.touches.TWO).toBe(TOUCH.DOLLY_PAN)
  })
})
