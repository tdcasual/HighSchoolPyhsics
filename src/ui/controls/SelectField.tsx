import type { ChangeEvent, ReactNode } from 'react'

type SelectOption = {
  value: string
  label: ReactNode
}

type SelectFieldProps = {
  id: string
  label: ReactNode
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  className?: string
}

export function SelectField({ id, label, value, onChange, options, className }: SelectFieldProps) {
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value)
  }

  return (
    <>
      <label htmlFor={id}>{label}</label>
      <select id={id} className={className} value={value} onChange={handleChange}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </>
  )
}
