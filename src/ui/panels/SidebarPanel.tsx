import { useState, type ReactNode } from 'react'

type SidebarPanelProps = {
  title?: string
  defaultWidth?: number
  defaultCollapsed?: boolean
  children: ReactNode
}

export function SidebarPanel({
  title,
  defaultWidth = 320,
  defaultCollapsed = false,
  children,
}: SidebarPanelProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)

  if (collapsed) {
    return (
      <div className="absolute left-0 top-0 bottom-0 z-30 flex">
        <button
          className="flex items-center justify-center w-10 bg-white/90 backdrop-blur-sm border-r border-gray-200 text-gray-500 hover:text-gray-700"
          onClick={() => setCollapsed(false)}
          aria-label="展开参数面板"
        >
          →
        </button>
      </div>
    )
  }

  return (
    <div
      className="absolute left-0 top-0 bottom-0 z-30 flex flex-col bg-white/90 backdrop-blur-sm border-r border-gray-200 transition-all duration-200"
      style={{ width: `${defaultWidth}px` }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        {title && <span className="text-sm font-medium">{title}</span>}
        <button
          className="text-gray-500 hover:text-gray-700"
          onClick={() => setCollapsed(true)}
          aria-label="折叠参数面板"
        >
          ←
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {children}
      </div>
    </div>
  )
}
