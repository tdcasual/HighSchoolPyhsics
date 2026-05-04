type SegmentedControlOption = {
  key: string
  label: string
}

type SegmentedControlProps = {
  options: SegmentedControlOption[]
  value: string
  onChange: (key: string) => void
  columns?: 2 | 3
}

export function SegmentedControl({ options, value, onChange, columns }: SegmentedControlProps) {
  const cols = columns ?? (options.length <= 2 ? 2 : 3)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const idx = options.findIndex((o) => o.key === value)
    if (idx < 0) return
    let nextIdx = -1
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      nextIdx = (idx + 1) % options.length
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      nextIdx = (idx - 1 + options.length) % options.length
    }
    if (nextIdx >= 0) onChange(options[nextIdx].key)
  }

  return (
    <div
      className="segmented-control grid gap-[3px] p-[3px] rounded-[12px]"
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        background: 'rgba(14, 165, 233, 0.08)',
        border: '1px solid rgba(14, 165, 233, 0.12)',
      }}
      role="radiogroup"
      onKeyDown={handleKeyDown}
    >
      {options.map((option) => {
        const active = option.key === value
        return (
          <button
            key={option.key}
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            className={[
              'min-h-[32px] md:min-h-[36px] text-[0.72rem] md:text-[0.8rem] font-semibold transition-all duration-150 select-none rounded-[10px]',
              active
                ? 'active text-white shadow-sm'
                : 'text-[var(--control-ink)] hover:bg-[var(--control-hover-bg)]',
            ].join(' ')}
            style={active ? {
              background: 'linear-gradient(135deg, #0ea5e9 0%, #2dd4bf 100%)',
              boxShadow: '0 2px 8px rgba(14, 165, 233, 0.25), inset 0 1px 0 0 rgba(255,255,255,0.2)',
            } : {}}
            onClick={() => onChange(option.key)}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
