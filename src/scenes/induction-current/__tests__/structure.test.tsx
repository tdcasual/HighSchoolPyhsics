import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { InductionCurrentScene } from '../InductionCurrentScene'

function queryRecordRows(): NodeListOf<HTMLTableRowElement> {
  return document.querySelectorAll('.induction-current-record-table tbody tr')
}

describe('induction-current structure', () => {
  it('renders key controls and keeps appending records before reset', async () => {
    render(<InductionCurrentScene />)

    expect(await screen.findByText('实验控制台')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: '↓ 向下运动 (接近)' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: '↑ 向上运动 (远离)' })).toBeInTheDocument()
    expect(await screen.findByText('暂无实验记录')).toBeInTheDocument()

    const moveTowardButton = await screen.findByRole('button', { name: '↓ 向下运动 (接近)' })
    const moveAwayButton = await screen.findByRole('button', { name: '↑ 向上运动 (远离)' })
    const poleTopButton = await screen.findByRole('button', { name: 'S 极在上 (N 下)' })

    fireEvent.click(moveTowardButton)
    expect(poleTopButton).toBeDisabled()

    await waitFor(() => expect(queryRecordRows()).toHaveLength(1))
    await waitFor(() => expect(poleTopButton).toBeEnabled())

    await waitFor(() => expect(moveAwayButton).toBeEnabled())
    fireEvent.click(moveAwayButton)

    await waitFor(() => expect(queryRecordRows()).toHaveLength(2))

    fireEvent.click(screen.getByRole('button', { name: '↺ 重置实验' }))
    expect(await screen.findByText('暂无实验记录')).toBeInTheDocument()
  })
})
