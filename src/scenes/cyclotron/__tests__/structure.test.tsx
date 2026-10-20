import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CyclotronScene } from '../CyclotronScene'

describe('cyclotron structure', () => {
  it('shows U-t and Ek-t charts with simulated and ideal energy curves', async () => {
    render(<CyclotronScene />)
    // Charts open on demand so they do not cover the D-box.
    fireEvent.click(await screen.findByRole('button', { name: '展开' }))

    const ideal = await screen.findByRole('radio', { name: '理想台阶' })
    const simulated = await screen.findByRole('radio', { name: '仿真（含加速时间）' })
    expect(await screen.findByText('U-t 曲线')).toBeInTheDocument()
    expect(screen.getByText('Ek-t 曲线（仿真）')).toBeInTheDocument()
    expect(simulated).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(ideal)
    expect(screen.getByText('Ek-t 曲线（理想台阶）')).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/\de[+-]\d/)
  })

  it('runs at textbook scale: proton, B = 1 T, R = 0.5 m gives about 12 MeV', async () => {
    render(<CyclotronScene />)
    expect(await screen.findByText('Eₖ,max = q²B²R²/(2m)')).toBeInTheDocument()
    expect(screen.getByText('12.0 MeV')).toBeInTheDocument()
    expect(screen.getByText('65.6 ns')).toBeInTheDocument()
  })

  it('单步 advances half a turn: one gap crossing and about qU more energy', async () => {
    render(<CyclotronScene />)
    const step = await screen.findByRole('button', { name: '单步 半圈' })
    act(() => {
      fireEvent.click(step)
    })
    act(() => {
      fireEvent.click(step)
    })
    // Two half turns from the ion source: two crossings at up to 0.15 MeV each.
    const energyRow = screen.getByText(/MeV · 2$/)
    const energy = Number(energyRow.textContent!.split(' ')[0])
    expect(energy).toBeGreaterThan(0.2)
    expect(energy).toBeLessThanOrEqual(0.31)
  })
})
