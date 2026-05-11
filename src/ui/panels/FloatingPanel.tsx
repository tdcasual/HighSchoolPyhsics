import { forwardRef, useEffect, useRef, useState, useCallback, type ReactNode, type CSSProperties } from 'react'
import { useDraggable } from '../hooks/useDraggable'

type FloatingPanelProps = {
  title: string
  icon?: ReactNode
  defaultPosition: { x: number; y: number }
  offsetX?: number
  defaultCollapsed?: boolean
  closable?: boolean
  onClose?: () => void
  zIndex?: 'z-10' | 'z-20'
  resizable?: boolean
  children: ReactNode
}

const HEADER_HEIGHT = 40
const VIEWPORT_MARGIN = 12
const MIN_MAX_HEIGHT = 160

const MIN_PANEL_WIDTH = 240
const MIN_PANEL_HEIGHT = 160

export const FloatingPanel = forwardRef<HTMLDivElement, FloatingPanelProps>(function FloatingPanel(
  {
    title,
    icon,
    defaultPosition,
    offsetX,
    defaultCollapsed = false,
    closable = false,
    onClose,
    zIndex = 'z-10',
    resizable = false,
    children,
  },
  forwardedRef,
) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const [maxContentHeight, setMaxContentHeight] = useState<number | undefined>()
  const prevMaxHeightRef = useRef<number | undefined>(undefined)
  const outerRef = useRef<HTMLDivElement>(null)
  const [panelSize, setPanelSize] = useState<{ width: number; height: number } | undefined>()
  const resizingRef = useRef(false)

  const { style, handlers, position } = useDraggable({
    initialPosition: defaultPosition,
    bounds: () => {
      const el = outerRef.current
      if (!el) return {}
      const vw = window.innerWidth
      const vh = window.innerHeight
      const w = panelSize?.width ?? el.getBoundingClientRect().width
      const h = panelSize?.height ?? el.getBoundingClientRect().height
      return { left: 0, top: 0, right: vw - w, bottom: vh - h }
    },
    offsetX,
  })

  useEffect(() => {
    const el = outerRef.current
    if (!el) return

    const update = () => {
      if (resizable && panelSize) return
      const rect = el.getBoundingClientRect()
      const available = window.innerHeight - rect.top - VIEWPORT_MARGIN
      const next = Math.max(MIN_MAX_HEIGHT, available - HEADER_HEIGHT)
      if (next !== prevMaxHeightRef.current) {
        prevMaxHeightRef.current = next
        setMaxContentHeight(next)
      }
    }

    update()
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null
    observer?.observe(el)
    window.addEventListener('resize', update)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [position.x, position.y, resizable, panelSize])

  const setRefs = useCallback(
    (el: HTMLDivElement | null) => {
      outerRef.current = el
      if (typeof forwardedRef === 'function') forwardedRef(el)
      else if (forwardedRef) forwardedRef.current = el
    },
    [forwardedRef],
  )

  const handleResizeStart = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (resizingRef.current) return
    e.preventDefault()
    e.stopPropagation()
    const el = outerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const start = { x: e.clientX, y: e.clientY, w: rect.width, h: rect.height }
    resizingRef.current = true
    const target = e.currentTarget
    target.setPointerCapture(e.pointerId)

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - start.x
      const dy = ev.clientY - start.y
      const nextW = Math.max(MIN_PANEL_WIDTH, start.w + dx)
      const nextH = Math.max(MIN_PANEL_HEIGHT, start.h + dy)
      setPanelSize({ width: nextW, height: nextH })
    }
    const onUp = () => {
      resizingRef.current = false
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [])

  const panelStyle: CSSProperties = {
    ...style,
    ...(panelSize ? { width: panelSize.width, height: collapsed ? undefined : panelSize.height } : {}),
  }

  return (
    <div
      ref={setRefs}
      role="region"
      aria-label={title}
      className={`floating-panel absolute ${zIndex} flex flex-col rounded-2xl select-none`}
      style={panelStyle}
    >
      <div
        className="panel-header flex items-center gap-2 px-3.5 py-2.5 cursor-grab active:cursor-grabbing shrink-0"
        {...handlers}
      >
        {icon}
        <span className="text-sm font-semibold tracking-tight">{title}</span>
        <button
          className="ml-auto min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-sm text-[var(--control-ink-muted)] hover:text-[var(--control-ink)] hover:bg-[var(--control-hover-bg)] transition-all duration-150"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? '展开' : '折叠'}
        >
          {collapsed ? '▼' : '▲'}
        </button>
        {closable && onClose && (
          <button
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-sm text-[var(--control-ink-muted)] hover:text-[var(--control-accent)] hover:bg-[var(--control-hover-bg)] transition-all duration-150"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onClose}
            aria-label="关闭"
          >
            ✕
          </button>
        )}
      </div>
      {!collapsed && (
        <div
          className={`px-3.5 pb-3 overflow-y-auto ${resizable ? 'flex-1 min-h-0' : ''}`}
          style={resizable ? undefined : { maxHeight: maxContentHeight }}
        >
          {children}
        </div>
      )}
      {resizable && (
        <div
          className="panel-resize-handle"
          onPointerDown={handleResizeStart}
          aria-label="调整大小"
          role="button"
          tabIndex={0}
        />
      )}
    </div>
  )
})
