import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MotionalEmfScene } from '../MotionalEmfScene'

describe('motional-emf structure', () => {
  it('renders both discussion modes and updates voltage in each mode', async () => {
    render(<MotionalEmfScene />)

    expect(await screen.findByText('切割磁感线实验控制')).toBeInTheDocument()
    expect(screen.getByText('速度方向预设')).toBeInTheDocument()

    screen.queryAllByRole('button', { name: '展开' }).forEach((button) => fireEvent.click(button))
    // The label is 电压 U<sub>AB</sub>; match on the span's combined text.
    const display = await screen.findByText((_, element) => element?.tagName === 'SPAN' && element.textContent === '电压 UAB')
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

  it('单步 freezes an instant of the motion: the rod moves and keeps its EMF', async () => {
    sessionStorage.clear()
    render(<MotionalEmfScene />)
    screen.queryAllByRole('button', { name: '展开' }).forEach((button) => fireEvent.click(button))
    fireEvent.click(screen.getByRole('button', { name: '单步 0.1 s' }))
    expect(screen.getByText('运动中（定格）')).toBeInTheDocument()
    expect(screen.getByText(/1\.00 V/)).toBeInTheDocument()
    expect(screen.queryByText('0%')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '重置' }))
    expect(screen.getByText('静止')).toBeInTheDocument()
  })
})
