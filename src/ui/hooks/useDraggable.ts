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
  const [position, setPositionRaw] = useState<Position>(initialPosition)
  const [effectiveOffsetX, setEffectiveOffsetX] = useState(offsetX)
  const basePositionRef = useRef(initialPosition)
  const prevOffsetXRef = useRef(offsetX)
  const boundsRef = useRef(bounds)
  const draggingRef = useRef(false)

  useEffect(() => { boundsRef.current = bounds }, [bounds])

  // Adjust base position when offsetX changes so displayed position stays stable.
  /* eslint-disable react-hooks/set-state-in-effect -- syncs offsetX prop to state */
  useEffect(() => {
    if (offsetX === undefined) {
      prevOffsetXRef.current = undefined
      setEffectiveOffsetX(undefined)
      return
    }

    const prevOffsetX = prevOffsetXRef.current
    prevOffsetXRef.current = offsetX
    setEffectiveOffsetX(offsetX)

    if (prevOffsetX !== undefined && offsetX !== prevOffsetX) {
      const dx = offsetX - prevOffsetX
      const clamped = clampPos(
        { x: basePositionRef.current.x + dx, y: basePositionRef.current.y },
        resolveBounds(boundsRef.current),
      )
      basePositionRef.current = clamped
      setPositionRaw(clamped)
    }
  }, [offsetX])
  /* eslint-enable react-hooks/set-state-in-effect */

  const setPosition = useCallback(
    (pos: Position) => {
      const clamped = clampPos(pos, resolveBounds(boundsRef.current))
      basePositionRef.current = clamped
      setPositionRaw(clamped)
    },
    [],
  )

  const onPointerDown: PointerEventHandler = useCallback(
    (event) => {
      if (draggingRef.current) return
      event.preventDefault()
      draggingRef.current = true
      const target = event.currentTarget as HTMLElement
      target.setPointerCapture(event.pointerId)
      const startPos = { ...basePositionRef.current }
      const startPointer = { x: event.clientX, y: event.clientY }
      const onMove = (e: PointerEvent) => {
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
    },
    [],
  )

  const finalX = position.x + (effectiveOffsetX ?? 0)

  return {
    style: { transform: `translate(${finalX}px, ${position.y}px)` } as CSSProperties,
    handlers: { onPointerDown },
    position,
    setPosition,
  }
}

export type { Position, DragBounds, UseDraggableOptions }
