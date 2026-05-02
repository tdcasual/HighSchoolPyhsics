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
        <h3 className="text-[0.72rem] md:text-[0.82rem] font-semibold text-[#4a6b84] dark:text-[#8fb0cc] m-0">
          {title}
        </h3>
        {children}
      </div>
    )
  }

  return (
    <div className="border border-[#d4e2ee] dark:border-[#2a4058] rounded-[12px] overflow-hidden">
      <button
        className="w-full flex items-center gap-2 px-2.5 py-2 md:px-3.5 md:py-2.5 text-[0.72rem] md:text-[0.82rem] font-semibold text-[#4a6b84] dark:text-[#8fb0cc] bg-transparent cursor-pointer hover:bg-[rgba(230,242,255,0.5)] dark:hover:bg-[rgba(20,38,58,0.5)] transition-colors"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="text-[0.7rem] text-[#8ca0b4] dark:text-[#5a7e98]">{open ? '▾' : '▸'}</span>
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
