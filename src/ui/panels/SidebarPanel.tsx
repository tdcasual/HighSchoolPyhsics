import { useState, type ReactNode } from 'react'

type SidebarPanelProps = {
  title?: string
  width?: number
  defaultCollapsed?: boolean
  children: ReactNode
}

export function SidebarPanel({
  title,
  width = 320,
  defaultCollapsed = false,
  children,
}: SidebarPanelProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)

  return (
    <div
      className="absolute left-0 top-0 bottom-0 z-30 flex bg-white/90 dark:bg-[#0c1826]/90 backdrop-blur-sm border-r border-gray-200 dark:border-[#2f4863] transition-all duration-200"
      style={{ width: collapsed ? 40 : width }}
    >
      {collapsed ? (
        <button
          className="flex items-center justify-center w-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          onClick={() => setCollapsed(false)}
          aria-label="展开参数面板"
        >
          →
        </button>
      ) : (
        <div className="flex flex-col w-full overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-[#2f4863]">
            {title && <span className="text-sm font-medium dark:text-[#ecf4ff]">{title}</span>}
            <button
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
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
      )}
    </div>
  )
}
