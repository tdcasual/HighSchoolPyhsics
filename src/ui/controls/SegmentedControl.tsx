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

  return (
    <div
      className="grid gap-0"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      role="radiogroup"
    >
      {options.map((option, i) => {
        const active = option.key === value
        const isFirst = i === 0
        const isLast = i === options.length - 1
        return (
          <button
            key={option.key}
            role="radio"
            aria-checked={active}
            className={[
              'min-h-[34px] md:min-h-[38px] text-[0.72rem] md:text-[0.82rem] font-medium transition-colors duration-150 select-none',
              'border border-[#8caec8] dark:border-[#3d5a75]',
              active
                ? 'bg-[#264f72] dark:bg-[#3d7db0] text-white font-semibold border-[#2f6b96] dark:border-[#4a8fc2]'
                : 'bg-[rgba(245,249,255,0.9)] dark:bg-[rgba(16,28,48,0.9)] text-[#2b4f6d] dark:text-[#b8d4ec] hover:bg-[rgba(230,242,255,0.95)] dark:hover:bg-[rgba(24,42,68,0.9)]',
              isFirst ? 'rounded-l-[8px]' : '',
              isLast ? 'rounded-r-[8px]' : '',
              !isFirst ? '-ml-[1px]' : '',
            ].join(' ')}
            onClick={() => onChange(option.key)}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
