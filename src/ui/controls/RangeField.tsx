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
  const progress = ((value - min) / (max - min)) * 100

  return (
    <div className="flex flex-col gap-0.5 md:gap-1">
      <div className="flex items-baseline justify-between gap-2">
        <label
          htmlFor={id}
          className="text-[0.75rem] md:text-[0.85rem] font-semibold tracking-tight"
          style={{ color: 'var(--control-ink-soft)' }}
        >
          {label}
        </label>
        <span
          className="text-[0.75rem] md:text-[0.85rem] font-mono font-bold tabular-nums"
          style={{ color: 'var(--readout-value)' }}
        >
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
        className="w-full"
        style={{
          background: `linear-gradient(90deg, #38bdf8 ${progress}%, rgba(14,165,233,0.15) ${progress}%)`,
        }}
      />
      {showMinMax && (
        <div className="flex justify-between text-[0.72rem] font-medium" style={{ color: 'var(--control-ink-muted)' }}>
          <span>{unit ? `${min} ${unit}` : min}</span>
          <span>{unit ? `${max} ${unit}` : max}</span>
        </div>
      )}
    </div>
  )
}
