import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OerstedScene } from '../OerstedScene'

describe('oersted controls', () => {
  it('exposes current, wire 3d, and drag-based needle placement controls', async () => {
    render(<OerstedScene />)

    expect(await screen.findByText('奥斯特电流磁效应')).toBeInTheDocument()
    expect(await screen.findByLabelText('电流 I (A)')).toBeInTheDocument()
    expect(await screen.findByLabelText('导线方位角 ψ (°)')).toBeInTheDocument()
    expect(await screen.findByLabelText('导线俯仰角 β (°)')).toBeInTheDocument()
    expect(await screen.findByLabelText('导线高度 h (m)')).toBeInTheDocument()
    expect(await screen.findByText('三枚小磁针位置（鼠标拖拽）')).toBeInTheDocument()
    expect(await screen.findByTestId('oersted-pos-1')).toHaveTextContent('磁针1: X 0.030 m · Z -0.080 m')
    expect(await screen.findByTestId('oersted-pos-2')).toHaveTextContent('磁针2: X 0.030 m · Z 0.000 m')
    expect(await screen.findByTestId('oersted-pos-3')).toHaveTextContent('磁针3: X 0.030 m · Z 0.080 m')
    expect(await screen.findByLabelText('磁针初始方向 θ0 (°)')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: '通电' })).toBeInTheDocument()
    expect(screen.queryByLabelText('磁针1位置 X (m)')).not.toBeInTheDocument()
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

    fireEvent.click(await screen.findByRole('button', { name: '有利摆放' }))
    expect(await screen.findByLabelText('电流 I (A)')).toHaveValue('8')
    expect(await screen.findByTestId('oersted-pos-1')).toHaveTextContent('磁针1: X 0.030 m')
    expect(await screen.findByText(/可观察性: 高/)).toBeInTheDocument()

    fireEvent.click(await screen.findByRole('button', { name: '不利摆放' }))
    expect(await screen.findByLabelText('电流 I (A)')).toHaveValue('4')
    expect(await screen.findByTestId('oersted-pos-1')).toHaveTextContent('磁针1: X 0.220 m')
    expect(await screen.findByText(/可观察性: 低/)).toBeInTheDocument()
  })

  it('allows adjusting wire orientation and height in 3d controls', async () => {
    render(<OerstedScene />)

    const azimuth = await screen.findByLabelText('导线方位角 ψ (°)')
    const pitch = await screen.findByLabelText('导线俯仰角 β (°)')
    const height = await screen.findByLabelText('导线高度 h (m)')

    fireEvent.change(azimuth, { target: { value: '120' } })
    fireEvent.change(pitch, { target: { value: '18' } })
    fireEvent.change(height, { target: { value: '0.12' } })

    expect(azimuth).toHaveValue('120')
    expect(pitch).toHaveValue('18')
    expect(height).toHaveValue('0.12')
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
