import { useState, type ReactNode } from 'react'

type ControlSectionProps = {
  title: string
  collapsible?: boolean
  defaultOpen?: boolean
  children: ReactNode
}

export function ControlSection({
  title,
  collapsible = false,
  defaultOpen = true,
  children,
}: ControlSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  if (!collapsible) {
    return (
      <div className="flex flex-col gap-2 md:gap-3">
        <h3 className="control-section-title text-[0.72rem] md:text-[0.82rem] font-semibold m-0 tracking-wide">
          {title}
        </h3>
        {children}
      </div>
    )
  }

  return (
    <div className="control-section-body rounded-[14px] overflow-hidden border"
      style={{
        background: 'var(--control-section-bg)',
        borderColor: 'var(--control-section-border)',
        boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.4)',
      }}
    >
      <button
        className="w-full flex items-center gap-2 px-2.5 py-2 md:px-3.5 md:py-2.5 text-[0.72rem] md:text-[0.82rem] font-semibold bg-transparent cursor-pointer rounded-[14px] transition-all duration-150 hover:bg-[var(--control-hover-bg)]"
        style={{ color: 'var(--control-ink)' }}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="text-[0.7rem]" style={{ color: 'var(--control-ink-muted)' }}>
          {open ? '▾' : '▸'}
        </span>
        {title}
      </button>
      {open && (
        <div className="flex flex-col gap-2 md:gap-3 px-2.5 pb-2.5 md:px-3.5 md:pb-3.5">
          {children}
        </div>
      )}
    </div>
  )
}
