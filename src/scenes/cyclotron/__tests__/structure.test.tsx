import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CyclotronScene } from '../CyclotronScene'

describe('cyclotron structure', () => {
  it('shows U-t and Ek-t charts with two energy modes', async () => {
    render(<CyclotronScene />)

    expect(await screen.findByText('U-t 曲线')).toBeInTheDocument()
    expect(await screen.findByText('Ek-t 曲线')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: '忽略加速时间' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: '考虑加速时间' })).toBeInTheDocument()
    expect(await screen.findByText(/电压方向:/)).toBeInTheDocument()
    expect(screen.queryByText(/速度 v:/)).not.toBeInTheDocument()
  })
})
