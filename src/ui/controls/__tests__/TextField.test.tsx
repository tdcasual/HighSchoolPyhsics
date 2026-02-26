import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TextField } from '../TextField'

describe('TextField', () => {
  it('renders labeled text input', () => {
    render(
      <TextField
        id="scope-expression"
        label="Ux(t) 函数"
        value="0"
        placeholder="例如: sin(t)"
        onChange={() => undefined}
      />,
    )

    const input = screen.getByLabelText('Ux(t) 函数')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'text')
    expect(input).toHaveValue('0')
    expect(input).toHaveAttribute('placeholder', '例如: sin(t)')
  })

  it('passes text value to onChange', () => {
    const onChange = vi.fn()

    render(
      <TextField id="scope-expression" label="Ux(t) 函数" value="0" onChange={onChange} />,
    )

    fireEvent.change(screen.getByLabelText('Ux(t) 函数'), {
      target: { value: '8*sawtooth(2*pi*2*t)' },
    })
    expect(onChange).toHaveBeenCalledWith('8*sawtooth(2*pi*2*t)')
  })
})
