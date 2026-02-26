import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SelectField } from '../SelectField'

describe('SelectField', () => {
  it('renders labeled select with options', () => {
    render(
      <SelectField
        id="scope-preset"
        label="常用函数"
        value="0"
        onChange={() => undefined}
        options={[
          { value: 'custom', label: '自定义' },
          { value: '0', label: '无电场 (0V)' },
        ]}
      />,
    )

    const select = screen.getByLabelText('常用函数')
    expect(select).toBeInTheDocument()
    expect(select).toHaveValue('0')
    expect(screen.getByRole('option', { name: '自定义' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '无电场 (0V)' })).toBeInTheDocument()
  })

  it('passes the selected value to onChange', () => {
    const onChange = vi.fn()

    render(
      <SelectField
        id="scope-preset"
        label="常用函数"
        value="custom"
        onChange={onChange}
        options={[
          { value: 'custom', label: '自定义' },
          { value: 'sine', label: '正弦波' },
        ]}
      />,
    )

    fireEvent.change(screen.getByLabelText('常用函数'), { target: { value: 'sine' } })
    expect(onChange).toHaveBeenCalledWith('sine')
  })
})
