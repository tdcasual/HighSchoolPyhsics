import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEventHandler } from 'react'

type Position = { x: number; y: number }
type DragBounds = { left?: number; top?: number; right?: number; bottom?: number }

type UseDraggableOptions = {
  initialPosition?: Position
  bounds?: DragBounds | (() => DragBounds)
  offsetX?: number
}

function clampPos(pos: Position, bounds: DragBounds | undefined): Position {
  if (!bounds) return pos
  return {
    x: Math.max(bounds.left ?? -Infinity, Math.min(bounds.right ?? Infinity, pos.x)),
    y: Math.max(bounds.top ?? -Infinity, Math.min(bounds.bottom ?? Infinity, pos.y)),
  }
}

function resolveBounds(bounds: DragBounds | (() => DragBounds) | undefined): DragBounds | undefined {
  if (!bounds) return undefined
  if (typeof bounds === 'function') return bounds()
  return bounds
}

export function useDraggable(options?: UseDraggableOptions) {
  const { initialPosition = { x: 0, y: 0 }, bounds, offsetX } = options ?? {}
  const initialX = initialPosition.x
  const initialY = initialPosition.y
  const [position, setPositionRaw] = useState<Position>(initialPosition)
  const [effectiveOffsetX, setEffectiveOffsetX] = useState(offsetX)
  const basePositionRef = useRef(initialPosition)
  const prevOffsetXRef = useRef(offsetX)
  const prevInitialPositionRef = useRef(initialPosition)
  const userMovedRef = useRef(false)
  const boundsRef = useRef(bounds)
  const draggingRef = useRef(false)

  useEffect(() => {
    boundsRef.current = bounds
  }, [bounds])

  // Follow layout positions while preserving the displayed position for offset-only changes.
  useEffect(() => {
    const previousPosition = prevInitialPositionRef.current
    const positionChanged = previousPosition.x !== initialX || previousPosition.y !== initialY
    prevInitialPositionRef.current = { x: initialX, y: initialY }

    const followsLayout = positionChanged && !userMovedRef.current && !draggingRef.current
    if (followsLayout) {
      const next = clampPos({ x: initialX, y: initialY }, resolveBounds(boundsRef.current))
      basePositionRef.current = next
      setPositionRaw(next)
    }

    if (offsetX === undefined) {
      prevOffsetXRef.current = undefined
      setEffectiveOffsetX(undefined)
      return
    }

    const previousOffsetX = prevOffsetXRef.current
    prevOffsetXRef.current = offsetX
    setEffectiveOffsetX(offsetX)

    // If the layout supplied a new base position in this render, its offset is
    // part of that position; applying the delta again would move the panel twice.
    if (previousOffsetX !== undefined && offsetX !== previousOffsetX && !followsLayout) {
      const dx = offsetX - previousOffsetX
      const clamped = clampPos(
        { x: basePositionRef.current.x + dx, y: basePositionRef.current.y },
        resolveBounds(boundsRef.current),
      )
      basePositionRef.current = clamped
      setPositionRaw(clamped)
    }
  }, [initialX, initialY, offsetX])

  useEffect(() => {
    const clampToViewport = () => {
      const current = basePositionRef.current
      const next = clampPos(current, resolveBounds(boundsRef.current))
      if (next.x !== current.x || next.y !== current.y) {
        basePositionRef.current = next
        setPositionRaw(next)
      }
    }
    window.addEventListener('resize', clampToViewport)
    clampToViewport()
    return () => window.removeEventListener('resize', clampToViewport)
  }, [])

  const setPosition = useCallback((pos: Position) => {
    const clamped = clampPos(pos, resolveBounds(boundsRef.current))
    basePositionRef.current = clamped
    setPositionRaw(clamped)
  }, [])

  const onPointerDown: PointerEventHandler = useCallback((event) => {
    if (draggingRef.current) return
    event.preventDefault()
    draggingRef.current = true
    const target = event.currentTarget as HTMLElement
    target.setPointerCapture(event.pointerId)
    const startPos = { ...basePositionRef.current }
    const startPointer = { x: event.clientX, y: event.clientY }
    const onMove = (e: PointerEvent) => {
      userMovedRef.current = true
      const dx = e.clientX - startPointer.x
      const dy = e.clientY - startPointer.y
      const resolved = resolveBounds(boundsRef.current)
      const clamped = clampPos({ x: startPos.x + dx, y: startPos.y + dy }, resolved)
      basePositionRef.current = clamped
      setPositionRaw(clamped)
    }
    const onUp = () => {
      draggingRef.current = false
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [])

  const finalX = position.x + (effectiveOffsetX ?? 0)

  return {
    style: { transform: `translate(${finalX}px, ${position.y}px)` } as CSSProperties,
    handlers: { onPointerDown },
    position,
    setPosition,
  }
}

export type { Position, DragBounds, UseDraggableOptions }
