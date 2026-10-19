import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MhdGeneratorScene } from '../MhdGeneratorScene'

describe('mhd controls', () => {
  it('exposes core controls and starts in paused state', async () => {
    render(<MhdGeneratorScene />)

    expect(await screen.findByText('磁流体发电机控制')).toBeInTheDocument()
    expect(await screen.findByLabelText('磁场 B')).toBeInTheDocument()
    expect(await screen.findByLabelText('等离子体速度 v')).toBeInTheDocument()
    expect(await screen.findByLabelText('电极间距 d')).toBeInTheDocument()
    expect(await screen.findByLabelText('载流子浓度 n/n₀')).toBeInTheDocument()
    expect(await screen.findByLabelText('负载电阻 RL')).toBeInTheDocument()
    const dataPanel = screen.getByRole('region', { name: '数据' })
    expect(await within(dataPanel).findByTestId('mhd-voltage-display')).toBeInTheDocument()

    const playbackPanel = screen.getByRole('region', { name: '播放控制' })
    expect(within(playbackPanel).getByRole('button', { name: '折叠' })).toBeInTheDocument()
    expect(await within(playbackPanel).findByRole('button', { name: '播放' })).toBeInTheDocument()
  })

  it('updates voltage display when magnetic field changes', async () => {
    render(<MhdGeneratorScene />)

    const dataPanel = screen.getByRole('region', { name: '数据' })
    const display = await within(dataPanel).findByTestId('mhd-voltage-display')
    const parseVoltageMagnitude = (text: string) => {
      const match = text.match(/([0-9.]+)\s*(M|k)?V/)
      const multiplier = match?.[2] === 'M' ? 1_000_000 : match?.[2] === 'k' ? 1_000 : 1
      return Number(match?.[1] ?? '0') * multiplier
    }
    const before = parseVoltageMagnitude(display.textContent ?? '')

    vi.useFakeTimers()
    fireEvent.change(screen.getByLabelText('磁场 B'), { target: { value: '3' } })
    vi.advanceTimersToNextTimer()
    vi.useRealTimers()

    const after = parseVoltageMagnitude((await within(dataPanel).findByTestId('mhd-voltage-display')).textContent ?? '')

    expect(after).toBeGreaterThan(before)
  })
})
