import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PotentialEnergyScene } from '../PotentialEnergyScene'

describe('potential-energy structure', () => {
  it('renders staged construction controls and readouts', async () => {
    render(<PotentialEnergyScene />)

    expect(await screen.findByText('电势图控制')).toBeInTheDocument()
    const dataPanel = screen.getByRole('region', { name: '数据' })
    expect(within(dataPanel).getByRole('button', { name: '展开' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: '1. 显示电势切片' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: '2. 开始旋转' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: '3. 重置' })).toBeInTheDocument()

    fireEvent.click(within(dataPanel).getByRole('button', { name: '展开' }))
    expect(await screen.findByText(/切片: 60 点/)).toBeInTheDocument()
  })
})
