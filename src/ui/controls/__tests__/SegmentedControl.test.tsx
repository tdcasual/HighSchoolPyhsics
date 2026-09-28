import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SegmentedControl } from '../SegmentedControl'

describe('SegmentedControl', () => {
  it('disables selection and arrow-key changes while the control is unavailable', () => {
    const onChange = vi.fn()
    render(
      <SegmentedControl
        value="north"
        disabled
        onChange={onChange}
        options={[
          { key: 'north', label: 'N 向上' },
          { key: 'south', label: 'N 向下' },
        ]}
      />,
    )

    const north = screen.getByRole('radio', { name: 'N 向上' })
    const south = screen.getByRole('radio', { name: 'N 向下' })
    expect(north).toBeDisabled()
    expect(south).toBeDisabled()
    fireEvent.click(south)
    fireEvent.keyDown(north, { key: 'ArrowRight' })
    expect(onChange).not.toHaveBeenCalled()
  })
})
