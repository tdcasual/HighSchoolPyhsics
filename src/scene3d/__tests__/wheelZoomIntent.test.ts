import { describe, expect, it } from 'vitest'
import { shouldAllowWheelZoom } from '../wheelZoomIntent'

describe('wheelZoomIntent', () => {
  it('allows wheel zoom when guard is disabled', () => {
    expect(
      shouldAllowWheelZoom({
        wheelZoomIntentGuard: false,
        eventTrusted: false,
        lastPointerIntentAtMs: null,
        nowMs: 1000,
      }),
    ).toBe(true)
  })

  it('blocks untrusted wheel events when guard is enabled', () => {
    expect(
      shouldAllowWheelZoom({
        wheelZoomIntentGuard: true,
        eventTrusted: false,
        lastPointerIntentAtMs: 900,
        nowMs: 1000,
      }),
    ).toBe(false)
  })

  it('blocks trusted wheel events without recent pointer intent', () => {
    expect(
      shouldAllowWheelZoom({
        wheelZoomIntentGuard: true,
        eventTrusted: true,
        lastPointerIntentAtMs: null,
        nowMs: 1000,
      }),
    ).toBe(false)
  })

  it('allows trusted wheel events within the intent window', () => {
    expect(
      shouldAllowWheelZoom({
        wheelZoomIntentGuard: true,
        eventTrusted: true,
        lastPointerIntentAtMs: 500,
        nowMs: 1800,
      }),
    ).toBe(true)
  })

  it('blocks trusted wheel events after the intent window expires', () => {
    expect(
      shouldAllowWheelZoom({
        wheelZoomIntentGuard: true,
        eventTrusted: true,
        lastPointerIntentAtMs: 500,
        nowMs: 2501,
        intentWindowMs: 2000,
      }),
    ).toBe(false)
  })
})
