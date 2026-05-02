import type { ChangeEvent, ReactNode } from 'react'

type RangeFieldProps = {
  id: string
  label: ReactNode
  min: number
  max: number
  step: number
  value: number
  onChange: (value: number) => void
  unit?: string
  displayValue?: string
  showMinMax?: boolean
}

export function RangeField({
  id,
  label,
  min,
  max,
  step,
  value,
  onChange,
  unit,
  displayValue,
  showMinMax = false,
}: RangeFieldProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(Number(event.target.value))
  }

  const valueText = displayValue ?? (unit ? `${value} ${unit}` : String(value))

  return (
    <div className="flex flex-col gap-0.5 md:gap-1">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-[0.75rem] md:text-[0.85rem] font-semibold text-[#3a5a78] dark:text-[#9cbad2]">
          {label}
        </label>
        <span className="text-[0.75rem] md:text-[0.85rem] font-mono text-[#3d6a8e] dark:text-[#7db8dc] tabular-nums">
          {valueText}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        className="w-full accent-[#2f95d5] dark:accent-[#58a8e8]"
      />
      {showMinMax && (
        <div className="flex justify-between text-[0.72rem] text-[#8ca0b4] dark:text-[#5a7e98]">
          <span>{unit ? `${min} ${unit}` : min}</span>
          <span>{unit ? `${max} ${unit}` : max}</span>
        </div>
      )}
    </div>
  )
}
