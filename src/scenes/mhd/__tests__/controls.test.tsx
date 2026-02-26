import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MhdGeneratorScene } from '../MhdGeneratorScene'

describe('mhd controls', () => {
  it('exposes core controls and starts in paused state', async () => {
    render(<MhdGeneratorScene />)

    expect(await screen.findByText('磁流体发电机控制')).toBeInTheDocument()
    expect(await screen.findByLabelText('磁场 B (T)')).toBeInTheDocument()
    expect(await screen.findByLabelText('等离子体速度 v (m/s)')).toBeInTheDocument()
    expect(await screen.findByLabelText('电极间距 d (m)')).toBeInTheDocument()
    expect(await screen.findByLabelText('等离子浓度 n')).toBeInTheDocument()
    expect(await screen.findByText('两端电压 U_AB')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: '播放' })).toBeInTheDocument()
  })

  it('updates voltage display when magnetic field changes', async () => {
    render(<MhdGeneratorScene />)

    const display = (await screen.findAllByTestId('mhd-voltage-display'))[0]
    const parseVoltage = (text: string) => Number(text.match(/([0-9.]+)\s*V/)?.[1] ?? '0')
    const before = parseVoltage(display.textContent ?? '')

    fireEvent.change(screen.getByLabelText('磁场 B (T)'), { target: { value: '3' } })
    const after = parseVoltage((await screen.findAllByTestId('mhd-voltage-display'))[0].textContent ?? '')

    expect(after).toBeGreaterThan(before)
  })
})
