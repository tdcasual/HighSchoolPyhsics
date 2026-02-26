import type { ChangeEvent, ReactNode } from 'react'

type TextFieldProps = {
  id: string
  label: ReactNode
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function TextField({ id, label, value, onChange, placeholder, className }: TextFieldProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value)
  }

  return (
    <>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        className={className}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={handleChange}
      />
    </>
  )
}
