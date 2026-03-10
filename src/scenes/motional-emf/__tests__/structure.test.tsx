import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MotionalEmfScene } from '../MotionalEmfScene'

describe('motional-emf structure', () => {
  it('renders core controls, legend, and updates voltage with actual motion state', async () => {
    render(<MotionalEmfScene />)

    expect(await screen.findByText('切割磁感线实验控制')).toBeInTheDocument()
    expect(screen.getByText('图例')).toBeInTheDocument()
    expect(screen.getByText('速度方向')).toBeInTheDocument()
    expect(screen.getByText('感应电流方向')).toBeInTheDocument()

    const display = await screen.findByTestId('motional-emf-voltage-display')
    expect(display).toHaveTextContent('0.00 V')

    fireEvent.click(screen.getByRole('button', { name: '播放' }))
    expect(await screen.findByTestId('motional-emf-voltage-display')).toHaveTextContent('1.00 V')

    fireEvent.click(screen.getByRole('button', { name: '暂停' }))
    expect(await screen.findByTestId('motional-emf-voltage-display')).toHaveTextContent('0.00 V')

    fireEvent.click(screen.getByRole('button', { name: '向上' }))
    expect(await screen.findByTestId('motional-emf-voltage-display')).toHaveTextContent('0.00 V')
  })
})
