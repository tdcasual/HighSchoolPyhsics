import { useCallback, useRef, useState, type CSSProperties, type PointerEventHandler } from 'react'

type Position = { x: number; y: number }
type DragBounds = { left?: number; top?: number; right?: number; bottom?: number }

type UseDraggableOptions = {
  initialPosition?: Position
  bounds?: DragBounds
}

function clampPos(pos: Position, bounds: DragBounds | undefined): Position {
  if (!bounds) return pos
  return {
    x: Math.max(bounds.left ?? -Infinity, Math.min(bounds.right ?? Infinity, pos.x)),
    y: Math.max(bounds.top ?? -Infinity, Math.min(bounds.bottom ?? Infinity, pos.y)),
  }
}

export function useDraggable(options?: UseDraggableOptions) {
  const { initialPosition = { x: 0, y: 0 }, bounds } = options ?? {}
  const [position, setPositionRaw] = useState<Position>(initialPosition)
  const dragRef = useRef<{ startPointer: Position; startPos: Position } | null>(null)
  const boundsRef = useRef(bounds)
  boundsRef.current = bounds

  const setPosition = useCallback(
    (pos: Position) => setPositionRaw(clampPos(pos, boundsRef.current)),
    [],
  )

  const onPointerDown: PointerEventHandler = useCallback(
    (event) => {
      event.preventDefault()
      const target = event.currentTarget as HTMLElement
      target.setPointerCapture(event.pointerId)
      dragRef.current = { startPointer: { x: event.clientX, y: event.clientY }, startPos: position }
      const onMove = (e: PointerEvent) => {
        if (!dragRef.current) return
        const dx = e.clientX - dragRef.current.startPointer.x
        const dy = e.clientY - dragRef.current.startPointer.y
        setPositionRaw(clampPos(
          { x: dragRef.current.startPos.x + dx, y: dragRef.current.startPos.y + dy },
          boundsRef.current,
        ))
      }
      const onUp = () => {
        dragRef.current = null
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
      }
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [position],
  )

  return {
    style: { transform: `translate(${position.x}px, ${position.y}px)` } as CSSProperties,
    handlers: { onPointerDown },
    position,
    setPosition,
  }
}

export type { Position, DragBounds, UseDraggableOptions }
