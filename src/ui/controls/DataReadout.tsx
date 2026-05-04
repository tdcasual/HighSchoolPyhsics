type ReadoutItem = {
  label: string
  value: string | number
}

type DataReadoutProps = {
  items: ReadoutItem[]
  separatorAfter?: number
}

export function DataReadout({ items, separatorAfter }: DataReadoutProps) {
  return (
    <div
      className="readout-panel rounded-[14px] px-2.5 py-2 md:px-3.5 md:py-2.5"
      style={{
        background: 'var(--readout-bg)',
        border: '1px solid var(--readout-border)',
        boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.4)',
      }}
    >
      <div className="flex flex-col gap-1">
        {items.map((item, index) => (
          <div key={`${item.label}-${index}`}>
            {(index > 0 || (separatorAfter !== undefined && index === separatorAfter)) && (
              <div
                className="readout-divider border-t my-1.5"
                style={{ borderColor: 'var(--readout-divider)' }}
              />
            )}
            <div className="flex justify-between items-baseline gap-2 min-h-[1.4em]">
              <span className="readout-item-label text-[0.72rem] md:text-[0.82rem] font-medium">
                {item.label}
              </span>
              <span className="readout-item-value text-[0.75rem] md:text-[0.85rem] font-mono font-bold tabular-nums text-right">
                {item.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
