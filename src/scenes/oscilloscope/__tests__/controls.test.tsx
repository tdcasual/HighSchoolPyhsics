import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OscilloscopeScene } from '../OscilloscopeScene'

describe('oscilloscope controls', () => {
  it('exposes the time-rate control, voltage inputs, and waveform presets', async () => {
    render(<OscilloscopeScene />)

    expect(await screen.findByText('动画时间倍率')).toBeInTheDocument()
    expect(await screen.findByText('X 偏转电压 Ux(t)')).toBeInTheDocument()
    expect(await screen.findByText('Y 偏转电压 Uy(t)')).toBeInTheDocument()
    expect(await screen.findByLabelText('Ux(t) 函数')).toHaveValue('8*sawtooth(2*pi*2*t-pi)')
    expect(await screen.findByLabelText('Uy(t) 函数')).toHaveValue('6*sin(2*pi*2*t)')
    expect(await screen.findByText((content) => content.includes('不等同于 TIME/DIV'))).toBeInTheDocument()
    expect(await screen.findByLabelText('X 波形预设')).toBeInTheDocument()
    expect(await screen.findByLabelText('Y 波形预设')).toBeInTheDocument()
    expect(await screen.findByRole('region', { name: '图表' })).toBeInTheDocument()
    expect(screen.queryByText('荧光屏显示')).not.toBeInTheDocument()
    expect(screen.queryByText(/模式:/)).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('X 波形预设'), {
      target: { value: '8*sawtooth(2*pi*2*t-pi)' },
    })
    expect(await screen.findByLabelText('Ux(t) 函数')).toHaveValue('8*sawtooth(2*pi*2*t-pi)')
  })
})
