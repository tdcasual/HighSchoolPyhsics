import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OscilloscopeScene } from '../OscilloscopeScene'

describe('oscilloscope structure', () => {
  it('renders X/Y electric field controls with formula support', async () => {
    render(<OscilloscopeScene />)

    expect(await screen.findByText('示波器控制')).toBeInTheDocument()
    expect(await screen.findByText('X 电场 Ux(t)')).toBeInTheDocument()
    expect(await screen.findByText('Y 电场 Uy(t)')).toBeInTheDocument()
    expect(await screen.findByLabelText('Ux(t) 函数')).toBeInTheDocument()
    expect(await screen.findByLabelText('Uy(t) 函数')).toBeInTheDocument()
    expect(await screen.findByText(/支持: \+ - \* \/ \^/)).toBeInTheDocument()
  })
})
