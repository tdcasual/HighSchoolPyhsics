import { useRef, useState, type ReactNode, type CSSProperties } from 'react'
import { useDraggable } from '../hooks/useDraggable'

type FloatingPanelProps = {
  title: string
  icon?: ReactNode
  defaultPosition: { x: number; y: number }
  defaultCollapsed?: boolean
  closable?: boolean
  onClose?: () => void
  zIndex?: 'z-10' | 'z-20'
  children: ReactNode
}

export function FloatingPanel({
  title,
  icon,
  defaultPosition,
  defaultCollapsed = false,
  closable = false,
  onClose,
  zIndex = 'z-10',
  children,
}: FloatingPanelProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const panelRef = useRef<HTMLDivElement>(null)
  const { style, handlers } = useDraggable({
    initialPosition: defaultPosition,
    bounds: () => {
      const el = panelRef.current
      if (!el) return {}
      const vw = window.innerWidth
      const vh = window.innerHeight
      const { width, height } = el.getBoundingClientRect()
      return { left: 0, top: 0, right: vw - width, bottom: vh - height }
    },
  })

  return (
    <div
      ref={panelRef}
      className={`absolute ${zIndex} flex flex-col rounded-lg shadow-lg bg-white/90 dark:bg-[#0c1826]/90 backdrop-blur-sm border border-gray-200 dark:border-[#2f4863] select-none`}
      style={style as CSSProperties}
    >
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-grab active:cursor-grabbing"
        {...handlers}
      >
        {icon}
        <span className="text-sm font-medium dark:text-[#ecf4ff]">{title}</span>
        <button
          className="ml-auto text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? '展开' : '折叠'}
        >
          {collapsed ? '▼' : '▲'}
        </button>
        {closable && onClose && (
          <button
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            onClick={onClose}
            aria-label="关闭"
          >
            ✕
          </button>
        )}
      </div>
      {!collapsed && <div className="px-3 pb-2">{children}</div>}
    </div>
  )
}
