import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDraggable } from '../useDraggable'

describe('useDraggable', () => {
  it('returns initial position', () => {
    const { result } = renderHook(() => useDraggable({ initialPosition: { x: 100, y: 200 } }))
    expect(result.current.position).toEqual({ x: 100, y: 200 })
  })

  it('returns a transform style', () => {
    const { result } = renderHook(() => useDraggable({ initialPosition: { x: 50, y: 75 } }))
    expect(result.current.style.transform).toBe('translate(50px, 75px)')
  })

  it('returns pointer down handler', () => {
    const { result } = renderHook(() => useDraggable({ initialPosition: { x: 0, y: 0 } }))
    expect(typeof result.current.handlers.onPointerDown).toBe('function')
  })

  it('allows setting position externally', () => {
    const { result } = renderHook(() => useDraggable({ initialPosition: { x: 0, y: 0 } }))
    act(() => result.current.setPosition({ x: 300, y: 400 }))
    expect(result.current.position).toEqual({ x: 300, y: 400 })
    expect(result.current.style.transform).toBe('translate(300px, 400px)')
  })

  it('clamps position within bounds', () => {
    const { result } = renderHook(() =>
      useDraggable({ initialPosition: { x: 0, y: 0 }, bounds: { left: 0, top: 0, right: 500, bottom: 500 } })
    )
    act(() => result.current.setPosition({ x: 600, y: -100 }))
    expect(result.current.position).toEqual({ x: 500, y: 0 })
  })

  it('defaults position to 0,0', () => {
    const { result } = renderHook(() => useDraggable())
    expect(result.current.position).toEqual({ x: 0, y: 0 })
  })

  it('adjusts base position when offsetX changes', () => {
    const { result, rerender } = renderHook(
      ({ offsetX }) => useDraggable({ initialPosition: { x: 100, y: 50 }, offsetX }),
      { initialProps: { offsetX: 200 } },
    )
    // base position stays at 100 (offsetX is additive in style, not in position state)
    expect(result.current.position.x).toBe(100)
    expect(result.current.style.transform).toBe('translate(300px, 50px)')

    // offsetX increases by 60 → base position shifts by 60
    rerender({ offsetX: 260 })
    expect(result.current.position.x).toBe(160)
    expect(result.current.style.transform).toBe('translate(420px, 50px)')
  })

  it('includes offsetX in transform when defined', () => {
    const { result } = renderHook(() =>
      useDraggable({ initialPosition: { x: 50, y: 30 }, offsetX: 100 }),
    )
    expect(result.current.style.transform).toBe('translate(150px, 30px)')
  })

  it('uses raw position in transform when offsetX is undefined', () => {
    const { result } = renderHook(() =>
      useDraggable({ initialPosition: { x: 50, y: 30 } }),
    )
    expect(result.current.style.transform).toBe('translate(50px, 30px)')
  })
})
