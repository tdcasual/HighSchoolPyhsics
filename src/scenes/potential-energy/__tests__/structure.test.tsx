import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PotentialEnergyScene } from '../PotentialEnergyScene'

describe('potential-energy structure', () => {
  it('renders staged construction controls and readouts', async () => {
    render(<PotentialEnergyScene />)

    expect(await screen.findByText('电势图构建控制')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: '1. 显示电势切片' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: '2. 开始旋转' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: '3. 重置' })).toBeInTheDocument()
    expect(await screen.findByText(/切片采样点:/)).toBeInTheDocument()
  })
})
