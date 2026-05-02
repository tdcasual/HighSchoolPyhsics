type DataReadoutItem = {
  label: string
  value: string
}

type DataReadoutProps = {
  items: DataReadoutItem[]
  separatorAfter?: number
}

export function DataReadout({ items, separatorAfter }: DataReadoutProps) {
  return (
    <div className="bg-[rgba(231,247,255,0.85)] dark:bg-[rgba(14,29,45,0.9)] border border-[#b6d3ea] dark:border-[#3f6285] rounded-[10px] px-2.5 py-2 md:px-3.5 md:py-2.5">
      {items.map((item, i) => (
        <div key={item.label}>
          <div className="flex justify-between items-baseline gap-2 min-h-[1.4em]">
            <span className="text-[0.72rem] md:text-[0.82rem] text-[#5a7e9a] dark:text-[#7da3c0]">{item.label}</span>
            <span className="text-[0.75rem] md:text-[0.85rem] font-mono font-semibold text-[#1c4f74] dark:text-[#d8ebff] tabular-nums text-right">
              {item.value}
            </span>
          </div>
          {separatorAfter !== undefined && i === separatorAfter - 1 && (
            <div className="border-t border-[#c8dde8] dark:border-[#2f4e68] my-1.5" />
          )}
        </div>
      ))}
    </div>
  )
}
