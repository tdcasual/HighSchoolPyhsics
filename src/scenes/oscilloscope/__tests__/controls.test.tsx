import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OscilloscopeScene } from '../OscilloscopeScene'

describe('oscilloscope controls', () => {
  it('exposes initial speed, function inputs, and quick preset selectors', async () => {
    render(<OscilloscopeScene />)

    expect(await screen.findByText('初始速度')).toBeInTheDocument()
    expect(await screen.findByText('X 电场 Ux(t)')).toBeInTheDocument()
    expect(await screen.findByText('Y 电场 Uy(t)')).toBeInTheDocument()
    expect(await screen.findByLabelText('Ux(t) 函数')).toHaveValue('0')
    expect(await screen.findByLabelText('Uy(t) 函数')).toHaveValue('0')
    expect(await screen.findByLabelText('X 常用函数')).toBeInTheDocument()
    expect(await screen.findByLabelText('Y 常用函数')).toBeInTheDocument()
    expect(await screen.findByText('荧光屏显示')).toBeInTheDocument()
    expect(screen.queryByText(/模式:/)).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('X 常用函数'), {
      target: { value: '8*sawtooth(2*pi*2*t)' },
    })
    expect(await screen.findByLabelText('Ux(t) 函数')).toHaveValue('8*sawtooth(2*pi*2*t)')
  })
})
