import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ElectrostaticLabScene } from '../ElectrostaticLabScene'

describe('electrostatic-lab structure', () => {
  it('renders core teaching controls and readout', async () => {
    render(<ElectrostaticLabScene />)

    expect(await screen.findByText('3D等势面实验台控制')).toBeInTheDocument()
    expect(await screen.findByText('课堂预设')).toBeInTheDocument()
    expect(await screen.findByText(/显示模式:/)).toBeInTheDocument()
    expect(await screen.findByText(/探针电势:/)).toBeInTheDocument()
  })

  it('supports enabling advanced interaction mode from controls', async () => {
    render(<ElectrostaticLabScene />)

    const toggleButton = await screen.findByRole('button', { name: '开启进阶交互' })
    fireEvent.click(toggleButton)

    expect(await screen.findByRole('button', { name: '关闭进阶交互' })).toBeInTheDocument()
    expect(
      await screen.findByText(/拖拽电荷移动、双击地面添加电荷、右键点击电荷删除/),
    ).toBeInTheDocument()
  })
})
