import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEventHandler } from 'react'

type Position = { x: number; y: number }
type DragBounds = { left?: number; top?: number; right?: number; bottom?: number }

type UseDraggableOptions = {
  initialPosition?: Position
  bounds?: DragBounds | (() => DragBounds)
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
  const { initialPosition = { x: 0, y: 0 }, bounds } = options ?? {}
  const [position, setPositionRaw] = useState<Position>(initialPosition)
  const posRef = useRef(position)
  const boundsRef = useRef(bounds)
  const draggingRef = useRef(false)

  useEffect(() => { posRef.current = position })
  useEffect(() => { boundsRef.current = bounds })

  const setPosition = useCallback(
    (pos: Position) => setPositionRaw(clampPos(pos, resolveBounds(boundsRef.current))),
    [],
  )

  const onPointerDown: PointerEventHandler = useCallback(
    (event) => {
      if (draggingRef.current) return
      event.preventDefault()
      draggingRef.current = true
      const target = event.currentTarget as HTMLElement
      target.setPointerCapture(event.pointerId)
      const startPos = { ...posRef.current }
      const startPointer = { x: event.clientX, y: event.clientY }
      const onMove = (e: PointerEvent) => {
        const dx = e.clientX - startPointer.x
        const dy = e.clientY - startPointer.y
        const resolved = resolveBounds(boundsRef.current)
        setPositionRaw(clampPos({ x: startPos.x + dx, y: startPos.y + dy }, resolved))
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

  return {
    style: { transform: `translate(${position.x}px, ${position.y}px)` } as CSSProperties,
    handlers: { onPointerDown },
    position,
    setPosition,
  }
}

export type { Position, DragBounds, UseDraggableOptions }
