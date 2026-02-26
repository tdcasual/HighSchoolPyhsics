import type { ChangeEvent, ReactNode } from 'react'

type RangeFieldProps = {
  id: string
  label: ReactNode
  min: number
  max: number
  step: number
  value: number
  onChange: (value: number) => void
}

export function RangeField({ id, label, min, max, step, value, onChange }: RangeFieldProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(Number(event.target.value))
  }

  return (
    <>
      <label htmlFor={id}>{label}</label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={handleChange} />
    </>
  )
}
