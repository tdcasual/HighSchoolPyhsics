import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PotentialEnergyScene } from '../PotentialEnergyScene'

describe('potential-energy structure', () => {
  it('renders staged construction controls and readouts', async () => {
    render(<PotentialEnergyScene />)

    expect(await screen.findByText('电势图控制')).toBeInTheDocument()
    const dataPanel = screen.getByRole('region', { name: '数据' })
    expect(within(dataPanel).getByRole('button', { name: '折叠' })).toBeInTheDocument()
    // Opens on the slice; the surface build is the playback action (Space starts it too).
    const playback = screen.getByRole('region', { name: '播放控制' })
    expect(within(playback).getByRole('button', { name: '旋转生成曲面' })).toBeEnabled()
    expect(within(playback).getByRole('button', { name: '单步 15°' })).toBeEnabled()

    expect(await screen.findByText(/^60 点/)).toBeInTheDocument()
  })
})
