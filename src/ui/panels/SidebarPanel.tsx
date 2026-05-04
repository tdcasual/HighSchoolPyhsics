import { useEffect, useRef, useState, type ReactNode } from 'react'

type SidebarPanelProps = {
  title?: string
  width?: number
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  children: ReactNode
}

const SIDEBAR_COLLAPSED_WIDTH = 44
const HEADER_BAR_HEIGHT = 52
const VIEWPORT_MARGIN = 8
const MIN_MAX_HEIGHT = 120

export function SidebarPanel({
  title,
  width = 320,
  collapsed = false,
  onCollapsedChange,
  children,
}: SidebarPanelProps) {
  const [maxContentHeight, setMaxContentHeight] = useState<number | undefined>()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = panelRef.current
    if (!el) return

    const update = () => {
      const rect = el.getBoundingClientRect()
      const available = window.innerHeight - rect.top - VIEWPORT_MARGIN
      setMaxContentHeight(Math.max(MIN_MAX_HEIGHT, available - HEADER_BAR_HEIGHT))
    }

    update()
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null
    observer?.observe(el)
    window.addEventListener('resize', update)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [collapsed])

  return (
    <div
      ref={panelRef}
      role="complementary"
      aria-label={title ?? '侧边栏'}
      className="sidebar-panel absolute left-0 top-0 bottom-0 z-30 flex transition-all duration-300 ease-out"
      style={{ width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : width }}
    >
      {collapsed ? (
        <button
          className="flex flex-col items-center justify-center w-full gap-1 min-h-[44px] rounded-xl mx-1 mt-2 text-[var(--control-ink-muted)] hover:text-[var(--control-ink)] hover:bg-[var(--control-hover-bg)] transition-all duration-150"
          onClick={() => onCollapsedChange?.(false)}
          aria-label="展开参数面板"
        >
          <span className="text-sm">→</span>
          {title && (
            <span className="text-xs font-semibold tracking-wide [writing-mode:vertical-rl]">
              {title}
            </span>
          )}
        </button>
      ) : (
        <div className="flex flex-col w-full overflow-hidden">
          <div className="panel-header flex items-center justify-between px-4 py-3 border-b shrink-0">
            {title && <span className="text-sm font-semibold tracking-tight">{title}</span>}
            <button
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[var(--control-ink-muted)] hover:text-[var(--control-ink)] hover:bg-[var(--control-hover-bg)] transition-all duration-150"
              onClick={() => onCollapsedChange?.(true)}
              aria-label="折叠参数面板"
            >
              ←
            </button>
          </div>
          <div
            className="flex-1 overflow-y-auto p-4"
            style={{ maxHeight: maxContentHeight }}
          >
            {children}
          </div>
        </div>
      )}
    </div>
  )
}
