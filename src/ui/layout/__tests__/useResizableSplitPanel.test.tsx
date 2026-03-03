import { act, renderHook } from '@testing-library/react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { describe, expect, it, vi } from 'vitest'
import {
  resolveResizedWidth,
  useResizableSplitPanel,
} from '../useResizableSplitPanel'

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  })
}

describe('useResizableSplitPanel', () => {
  it('clamps pointer-based resizing inside bounds', () => {
    expect(resolveResizedWidth(320, 100, -200, 240, 500)).toBe(240)
    expect(resolveResizedWidth(320, 100, 1000, 240, 500)).toBe(500)
    expect(resolveResizedWidth(320, 100, 140, 240, 500)).toBe(360)
  })

  it('keeps keyboard resizing inside bounds', () => {
    setViewportWidth(1366)

    const { result } = renderHook(() =>
      useResizableSplitPanel({
        compact: false,
        tier: 'desktop',
        presentationMode: false,
        presentationStrategy: 'viewport',
      }),
    )

    const leftEvent = {
      key: 'ArrowLeft',
      shiftKey: true,
      preventDefault: vi.fn(),
    } as unknown as ReactKeyboardEvent<HTMLButtonElement>

    const rightEvent = {
      key: 'ArrowRight',
      shiftKey: true,
      preventDefault: vi.fn(),
    } as unknown as ReactKeyboardEvent<HTMLButtonElement>

    act(() => {
      for (let index = 0; index < 20; index += 1) {
        result.current.onDividerKeyDown(leftEvent)
      }
    })
    expect(result.current.resolvedLeftPanelWidthPx).toBe(result.current.minLeftWidthPx)

    act(() => {
      for (let index = 0; index < 40; index += 1) {
        result.current.onDividerKeyDown(rightEvent)
      }
    })
    expect(result.current.resolvedLeftPanelWidthPx).toBe(result.current.maxLeftWidthPx)
  })

  it('ignores keyboard resize when compact layout is active', () => {
    setViewportWidth(1366)

    const { result } = renderHook(() =>
      useResizableSplitPanel({
        compact: true,
        tier: 'desktop',
        presentationMode: false,
        presentationStrategy: 'viewport',
      }),
    )

    const before = result.current.resolvedLeftPanelWidthPx
    const event = {
      key: 'ArrowRight',
      shiftKey: false,
      preventDefault: vi.fn(),
    } as unknown as ReactKeyboardEvent<HTMLButtonElement>

    act(() => {
      result.current.onDividerKeyDown(event)
    })

    expect(result.current.resolvedLeftPanelWidthPx).toBe(before)
  })
})
