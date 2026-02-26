import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OerstedScene } from '../OerstedScene'

describe('oersted controls', () => {
  it('exposes classroom core controls and keeps advanced controls collapsed by default', async () => {
    render(<OerstedScene />)

    expect(await screen.findByText('奥斯特电流磁效应')).toBeInTheDocument()
    expect(await screen.findByLabelText('电流 I (A)')).toBeInTheDocument()
    expect(await screen.findByLabelText('导线高度 h (m)')).toBeInTheDocument()
    const advancedToggle = await screen.findByRole('button', { name: '显示高级参数' })
    expect(advancedToggle).toHaveAttribute('aria-expanded', 'false')
    expect(advancedToggle).toHaveClass('touch-target')
    expect(screen.queryByLabelText('地磁场 B0 (μT)')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('导线方位角 ψ (°)')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('导线俯仰角 β (°)')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('磁针初始方向 θ0 (°)')).not.toBeInTheDocument()
    expect(screen.queryByText('三枚小磁针位置（鼠标拖拽）')).not.toBeInTheDocument()
    expect(screen.queryByText(/磁针1: X/)).not.toBeInTheDocument()
    expect(await screen.findByRole('button', { name: '通电' })).toBeInTheDocument()
    expect(await screen.findByText('极性标识：红色为正极(+)，蓝色为负极(-)。')).toBeInTheDocument()
  })

  it('updates observed swing value when current changes', async () => {
    render(<OerstedScene />)

    const beforeText = (await screen.findByTestId('oersted-swing-1')).textContent ?? ''
    const parseSwing = (text: string) => Number(text.match(/([-+]?\d+(?:\.\d+)?)°/)?.[1] ?? '0')
    const before = Math.abs(parseSwing(beforeText))

    fireEvent.change(screen.getByLabelText('电流 I (A)'), { target: { value: '8' } })

    const afterText = (await screen.findByTestId('oersted-swing-1')).textContent ?? ''
    const after = Math.abs(parseSwing(afterText))

    expect(after).not.toBe(before)
  })

  it('applies classroom presets in one click', async () => {
    render(<OerstedScene />)

    const favorablePreset = await screen.findByRole('button', { name: '有利摆放' })
    const adversePreset = await screen.findByRole('button', { name: '不利摆放' })

    fireEvent.click(favorablePreset)
    expect(await screen.findByLabelText('电流 I (A)')).toHaveValue('8')
    expect(await screen.findByText(/可观察性: 高/)).toBeInTheDocument()
    expect(favorablePreset).toHaveAttribute('aria-pressed', 'true')
    expect(adversePreset).toHaveAttribute('aria-pressed', 'false')
    expect(favorablePreset).toHaveClass('touch-target')

    fireEvent.click(adversePreset)
    expect(await screen.findByLabelText('电流 I (A)')).toHaveValue('4')
    expect(await screen.findByText(/可观察性: 低/)).toBeInTheDocument()
    expect(favorablePreset).toHaveAttribute('aria-pressed', 'false')
    expect(adversePreset).toHaveAttribute('aria-pressed', 'true')
    expect(adversePreset).toHaveClass('touch-target')
  })

  it('allows adjusting wire orientation and height in 3d controls', async () => {
    render(<OerstedScene />)

    const height = await screen.findByLabelText('导线高度 h (m)')
    fireEvent.click(await screen.findByRole('button', { name: '显示高级参数' }))

    const azimuth = await screen.findByLabelText('导线方位角 ψ (°)')
    const pitch = await screen.findByLabelText('导线俯仰角 β (°)')

    fireEvent.change(azimuth, { target: { value: '120' } })
    fireEvent.change(pitch, { target: { value: '18' } })
    fireEvent.change(height, { target: { value: '0.12' } })

    expect(azimuth).toHaveValue('120')
    expect(pitch).toHaveValue('18')
    expect(height).toHaveValue('0.12')
  })

  it('shows and hides advanced controls through one toggle button', async () => {
    render(<OerstedScene />)

    const toggle = await screen.findByRole('button', { name: '显示高级参数' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByLabelText('导线方位角 ψ (°)')).not.toBeInTheDocument()

    fireEvent.click(toggle)

    expect(await screen.findByRole('button', { name: '收起高级参数' })).toHaveAttribute('aria-expanded', 'true')
    expect(await screen.findByLabelText('地磁场 B0 (μT)')).toBeInTheDocument()
    expect(await screen.findByLabelText('导线方位角 ψ (°)')).toBeInTheDocument()

    fireEvent.click(await screen.findByRole('button', { name: '收起高级参数' }))

    expect(await screen.findByRole('button', { name: '显示高级参数' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByLabelText('导线方位角 ψ (°)')).not.toBeInTheDocument()
  })

  it('toggles magnetic field lines with one click', async () => {
    render(<OerstedScene />)

    const toggle = await screen.findByRole('button', { name: '隐藏磁感线' })
    fireEvent.click(toggle)
    expect(await screen.findByRole('button', { name: '显示磁感线' })).toBeInTheDocument()

    fireEvent.click(await screen.findByRole('button', { name: '显示磁感线' }))
    expect(await screen.findByRole('button', { name: '隐藏磁感线' })).toBeInTheDocument()
  })
})
