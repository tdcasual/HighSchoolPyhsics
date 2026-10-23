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
  /** Which layout zone this panel is; styles (e.g. classroom large text) key off it. */
  zone?: 'data' | 'chart' | 'playback'
  /** Extra header buttons, placed before the collapse button. */
  headerActions?: ReactNode
  children: ReactNode
}

const HEADER_HEIGHT = 46
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
    zone,
    headerActions,
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
      const parentRect =
        el.offsetParent instanceof HTMLElement ? el.offsetParent.getBoundingClientRect() : { left: 0, top: 0 }
      const renderedOffsetX = offsetX ?? 0
      return {
        left: VIEWPORT_MARGIN - parentRect.left - renderedOffsetX,
        top: 0,
        right: vw - parentRect.left - w - VIEWPORT_MARGIN - renderedOffsetX,
        bottom: vh - parentRect.top - h - VIEWPORT_MARGIN,
      }
    },
    offsetX,
  })

  useEffect(() => {
    const el = outerRef.current
    if (!el) return

    const update = () => {
      const rect = el.getBoundingClientRect()
      const available = Math.max(MIN_MAX_HEIGHT + HEADER_HEIGHT, window.innerHeight - rect.top - VIEWPORT_MARGIN)
      const next = available - HEADER_HEIGHT
      if (next !== prevMaxHeightRef.current) {
        prevMaxHeightRef.current = next
        setMaxContentHeight(next)
      }
      if (resizable && panelSize && panelSize.height > available) {
        setPanelSize((current) => (current && current.height > available ? { ...current, height: available } : current))
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
    ...(resizable && maxContentHeight !== undefined ? { maxHeight: maxContentHeight + HEADER_HEIGHT } : {}),
    ...(panelSize ? { width: panelSize.width, height: collapsed ? undefined : panelSize.height } : {}),
  }

  return (
    <div
      ref={setRefs}
      role="region"
      aria-label={title}
      data-collapsed={collapsed ? 'true' : undefined}
      data-panel={zone}
      className={`floating-panel absolute ${zIndex} flex flex-col rounded-2xl select-none`}
      style={panelStyle}
    >
      <div
        className="panel-header flex items-center gap-1 pl-3.5 pr-1 cursor-grab active:cursor-grabbing shrink-0"
        {...handlers}
      >
        {icon}
        <span className="panel-title">{title}</span>
        <span className="ml-auto" />
        {headerActions ? (
          <span className="panel-header-actions" onPointerDown={(e) => e.stopPropagation()}>
            {headerActions}
          </span>
        ) : null}
        <button
          className="panel-icon-button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? '展开' : '折叠'}
          aria-expanded={!collapsed}
        >
          <svg className="panel-chevron" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
            <path
              d="M4 10l4-4 4 4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {closable && onClose && (
          <button
            className="panel-icon-button panel-close-button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onClose}
            aria-label="关闭"
          >
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
      {!collapsed && (
        <div
          className={`panel-body overflow-y-auto ${resizable ? 'flex-1 min-h-0' : ''}`}
          style={{ maxHeight: maxContentHeight }}
        >
          {children}
        </div>
      )}
      {resizable && !collapsed && (
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
