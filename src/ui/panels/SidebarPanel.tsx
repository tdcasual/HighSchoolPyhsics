import { useEffect, useRef, useState, type ReactNode } from 'react'

type SidebarPanelProps = {
  title?: string
  width?: number
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  children: ReactNode
}

const SIDEBAR_COLLAPSED_WIDTH = 44
const HEADER_BAR_HEIGHT = 47
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
        <button className="sidebar-rail-button" onClick={() => onCollapsedChange?.(false)} aria-label="展开参数面板">
          <SidebarChevron direction="right" />
          {title && <span className="sidebar-rail-title">{title}</span>}
        </button>
      ) : (
        <div className="flex flex-col w-full overflow-hidden">
          <div className="panel-header flex items-center justify-between pl-4 pr-1 border-b shrink-0">
            {title && <span className="panel-title">{title}</span>}
            <button className="panel-icon-button" onClick={() => onCollapsedChange?.(true)} aria-label="折叠参数面板">
              <SidebarChevron direction="left" />
            </button>
          </div>
          <div className="sidebar-body flex-1 overflow-y-auto px-4 pt-3 pb-5" style={{ maxHeight: maxContentHeight }}>
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

function SidebarChevron({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path
        d={direction === 'left' ? 'M10 4l-4 4 4 4' : 'M6 4l4 4-4 4'}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
