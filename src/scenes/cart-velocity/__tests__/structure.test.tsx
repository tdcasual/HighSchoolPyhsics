import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const canvasProps: { current: Record<string, unknown> | null } = { current: null }

vi.mock('../../../scene3d/InteractiveCanvas', () => ({
  InteractiveCanvas: ({ children, ...props }: { children: ReactNode }) => {
    canvasProps.current = props
    return <div data-testid="interactive-canvas">{children}</div>
  },
}))

vi.mock('../CartRig3D', () => ({
  CartRig3D: () => <div data-testid="cart-rig" />,
}))

import { CartScene } from '../CartScene'

describe('cart structure', () => {
  it('opens on the bench with the reference camera and steps one dot', () => {
    render(<CartScene />)
    expect(screen.getByRole('heading', { name: '小车速度控制' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '实验' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '小车 v-t 图像' })).toBeInTheDocument()
    expect(screen.getByTestId('cart-rig')).toBeInTheDocument()
    const readout = () => screen.getByText('时间').closest('p')?.parentElement
    expect(readout()).toHaveTextContent('0.00 s')
    expect(readout()).toHaveTextContent('0.100 m/s')
    expect(readout()).toHaveTextContent('3 个 · 0.555 m/s²')
    const camera = canvasProps.current?.camera as { fov: number }
    const controls = canvasProps.current?.controls as { maxDistance: number; minDistance: number; target: number[] }
    expect(camera.fov).toBe(35)
    expect(controls.minDistance).toBe(6)
    expect(controls.maxDistance).toBe(23)
    // The bench is fitted to the free area: the target is the measured centre of the apparatus.
    expect(controls.target.every(Number.isFinite)).toBe(true)
    expect(canvasProps.current?.adaptiveFraming).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: '单步' }))
    expect(readout()).toHaveTextContent('0.02 s')
    expect(readout()).toHaveTextContent('0.111 m/s')
    expect(readout()).toHaveTextContent('打点2')
  })

  it('clears a component close-up and restores the overview when assembly begins', () => {
    render(<CartScene />)
    const homePosition = [...(canvasProps.current?.camera as { position: number[] }).position]
    fireEvent.click(screen.getByText('电磁打点计时器').closest('button') as HTMLButtonElement)
    expect((canvasProps.current?.camera as { position: number[] }).position).not.toEqual(homePosition)
    expect(screen.getByRole('radio', { name: '特写' })).toHaveAttribute('aria-checked', 'true')

    fireEvent.click(screen.getByRole('radio', { name: '装配' }))
    expect((canvasProps.current?.camera as { position: number[] }).position).toEqual(homePosition)
    expect(screen.getByRole('radio', { name: '透视' })).toHaveAttribute('aria-checked', 'true')
  })

  it('switches to the uniform preset and locks playback during assembly', () => {
    render(<CartScene />)
    fireEvent.click(screen.getByRole('radio', { name: '实验' }))
    fireEvent.click(screen.getByRole('button', { name: '匀速对照' }))
    const readout = () => screen.getByText('时间').closest('p')?.parentElement
    expect(readout()).toHaveTextContent('0.200 m/s')
    expect(readout()).toHaveTextContent('不挂钩码')
    fireEvent.click(screen.getByRole('radio', { name: '装配' }))
    expect(screen.getByRole('button', { name: '开始实验' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: '开始实验' }))
    expect(readout()).toHaveTextContent('0.00 s')
    fireEvent.click(screen.getByRole('radio', { name: '正视' }))
    const beforeTop = [...(canvasProps.current?.camera as { position: number[] }).position]
    fireEvent.click(screen.getByRole('radio', { name: '俯视' }))
    const afterTop = (canvasProps.current?.camera as { position: number[] }).position
    expect(afterTop).not.toEqual(beforeTop)
    fireEvent.click(screen.getByRole('radio', { name: '正视' }))
    const controls = canvasProps.current?.controls as { target: number[] }
    // The bench is fitted to the free area: the target is the measured centre of the apparatus.
    expect(controls.target.every(Number.isFinite)).toBe(true)
  })
})
