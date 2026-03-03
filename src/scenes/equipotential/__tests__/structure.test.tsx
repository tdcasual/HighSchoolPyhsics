import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EquipotentialScene } from '../EquipotentialScene'

describe('equipotential structure', () => {
  it('renders controls and readout needed for classroom explanation', async () => {
    render(<EquipotentialScene />)

    expect(await screen.findByText('电荷等势面控制')).toBeInTheDocument()
    expect(await screen.findByText('双极子基线')).toBeInTheDocument()
    expect(await screen.findByText(/正势面点数:/)).toBeInTheDocument()
    expect(await screen.findByText(/负势面点数:/)).toBeInTheDocument()
  })

  it('keeps unique charge ids after deleting and adding charges', async () => {
    render(<EquipotentialScene />)

    fireEvent.click(await screen.findByRole('button', { name: '删除选中' }))
    fireEvent.click(await screen.findByRole('button', { name: '添加 + 电荷' }))

    const select = (await screen.findByLabelText('当前目标')) as HTMLSelectElement
    const values = Array.from(select.options).map((option) => option.value)

    expect(values).toContain('C3')
    expect(new Set(values).size).toBe(values.length)
  })
})
