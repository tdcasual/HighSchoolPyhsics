import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MotionalEmfScene } from '../MotionalEmfScene'

describe('motional-emf structure', () => {
  it('renders both discussion modes and updates voltage in each mode', async () => {
    render(<MotionalEmfScene />)

    expect(await screen.findByText('切割磁感线实验控制')).toBeInTheDocument()
    expect(screen.getByText('速度方向预设')).toBeInTheDocument()

    const display = await screen.findByText(/电压 U_AB:/)
    expect(display).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '播放' }))
    expect(await screen.findByText(/1\.00 V/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '暂停' }))
    fireEvent.click(screen.getByRole('radio', { name: '按 ∠(L,v) 讨论' }))
    expect(screen.getByText('L 与 v 夹角预设')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('radio', { name: 'L 与 v 成 30°' }))
    fireEvent.click(screen.getByRole('button', { name: '播放' }))
    expect(await screen.findByText(/0\.50 V/)).toBeInTheDocument()
  })
})
