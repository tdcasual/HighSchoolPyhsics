import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CyclotronScene } from '../CyclotronScene'

describe('cyclotron structure', () => {
  it('shows U-t and Ek-t charts with two energy modes', async () => {
    render(<CyclotronScene />)
    // Charts open on demand so they do not cover the D-box.
    fireEvent.click(await screen.findByRole('button', { name: '展开' }))

    const ignoreAcceleration = await screen.findByRole('radio', { name: '忽略加速时间' })
    const includeAcceleration = await screen.findByRole('radio', { name: '考虑加速时间' })

    expect(await screen.findByText('U-t 曲线')).toBeInTheDocument()
    expect(await screen.findByText('Ek-t 曲线（理论）')).toBeInTheDocument()
    expect(ignoreAcceleration).toBeInTheDocument()
    expect(includeAcceleration).toBeInTheDocument()
    expect(ignoreAcceleration).toHaveAttribute('aria-checked', 'false')
    expect(includeAcceleration).toHaveAttribute('aria-checked', 'true')
    // Readouts use textbook notation (×10ⁿ), never JavaScript's 1.40e-17.
    expect(await screen.findByText('缝隙电压 U')).toBeInTheDocument()
    expect(screen.getByText(/×10⁻¹⁷ J/)).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/\de[+-]\d/)
    expect(screen.queryByText(/速度 v:/)).not.toBeInTheDocument()
  })
})
