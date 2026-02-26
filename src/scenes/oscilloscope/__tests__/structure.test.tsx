import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OscilloscopeScene } from '../OscilloscopeScene'

describe('oscilloscope structure', () => {
  it('shows key CRT components for 3D teaching model', async () => {
    render(<OscilloscopeScene />)

    expect(await screen.findByText('结构组成')).toBeInTheDocument()
    expect(await screen.findByText('电子枪')).toBeInTheDocument()
    expect(await screen.findByText('Y 偏转板')).toBeInTheDocument()
    expect(await screen.findByText('X 偏转板')).toBeInTheDocument()
    expect(await screen.findByText('荧光屏')).toBeInTheDocument()
  })
})
