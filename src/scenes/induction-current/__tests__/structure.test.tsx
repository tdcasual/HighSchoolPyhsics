import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { InductionCurrentScene } from '../InductionCurrentScene'

function queryRecordLabels(): HTMLElement[] {
  return screen.queryAllByText(/^记录 #/)
}

describe('induction-current structure', () => {
  it('renders key controls and keeps appending records before reset', async () => {
    render(<InductionCurrentScene />)

    expect(await screen.findByText('感应电流实验控制')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: '↓ 向下运动 (接近)' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: '↑ 向上运动 (远离)' })).toBeInTheDocument()
    expect(screen.getByText('暂无实验记录')).toBeInTheDocument()

    const moveTowardButton = await screen.findByRole('button', { name: '↓ 向下运动 (接近)' })
    const moveAwayButton = await screen.findByRole('button', { name: '↑ 向上运动 (远离)' })

    fireEvent.click(moveTowardButton)

    await waitFor(() => expect(queryRecordLabels()).toHaveLength(1))
    await waitFor(() => expect(moveAwayButton).toBeEnabled())

    fireEvent.click(moveAwayButton)

    await waitFor(() => expect(queryRecordLabels()).toHaveLength(2))

    fireEvent.click(screen.getByRole('button', { name: '↺ 重置实验' }))
    expect(screen.getByText('暂无实验记录')).toBeInTheDocument()
  })
})
