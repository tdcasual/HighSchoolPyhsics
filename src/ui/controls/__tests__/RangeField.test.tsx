import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RangeField } from '../RangeField'

describe('RangeField', () => {
  it('renders an accessible range input from label and id', () => {
    render(
      <RangeField
        id="range-speed"
        label="速度"
        min={0}
        max={10}
        step={0.5}
        value={2}
        onChange={() => undefined}
      />,
    )

    const input = screen.getByLabelText('速度')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'range')
    expect(input).toHaveValue('2')
  })

  it('parses next value as number and calls onChange', () => {
    const onChange = vi.fn()

    render(
      <RangeField
        id="range-current"
        label="电流"
        min={-8}
        max={8}
        step={0.2}
        value={0}
        onChange={onChange}
      />,
    )

    fireEvent.change(screen.getByLabelText('电流'), { target: { value: '3.6' } })
    expect(onChange).toHaveBeenCalledWith(3.6)
  })
})
