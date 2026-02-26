import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CyclotronScene } from '../CyclotronScene'

describe('cyclotron structure', () => {
  it('shows U-t and Ek-t charts with two energy modes', async () => {
    render(<CyclotronScene />)

    const ignoreAcceleration = await screen.findByRole('button', { name: '忽略加速时间' })
    const includeAcceleration = await screen.findByRole('button', { name: '考虑加速时间' })

    expect(await screen.findByText('U-t 曲线')).toBeInTheDocument()
    expect(await screen.findByText('Ek-t 曲线')).toBeInTheDocument()
    expect(ignoreAcceleration).toBeInTheDocument()
    expect(includeAcceleration).toBeInTheDocument()
    expect(ignoreAcceleration).toHaveAttribute('aria-pressed', 'false')
    expect(includeAcceleration).toHaveAttribute('aria-pressed', 'true')
    expect(ignoreAcceleration).toHaveClass('touch-target')
    expect(includeAcceleration).toHaveClass('touch-target')
    expect(await screen.findByText(/自适应出发 y0:/)).toBeInTheDocument()
    expect(screen.queryByText(/自适应出发 x0:/)).not.toBeInTheDocument()
    expect(await screen.findByText(/电压方向:/)).toBeInTheDocument()
    expect(screen.queryByText(/速度 v:/)).not.toBeInTheDocument()
  })
})
