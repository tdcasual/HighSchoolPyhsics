import { afterEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { SceneLayout } from '../SceneLayout'
import { Answer } from '../../notes/Answer'
import { useAppStore } from '../../../store/useAppStore'

function renderWithAnswers() {
  render(
    <SceneLayout
      controls={<div>params</div>}
      viewport={<div>canvas</div>}
      dataOverlay={
        <div>
          <p>
            <span>已知 B</span>
            <strong>1.0 T</strong>
          </p>
          <p>
            <span>电动势</span>
            <strong>
              <Answer>0.50 V</Answer>
            </strong>
          </p>
          <p>
            <span>方向</span>
            <strong>
              <Answer>A → B</Answer>
            </strong>
          </p>
        </div>
      }
    />,
  )
  return within(screen.getByRole('region', { name: '数据' }))
}

describe('SceneLayout prediction mode', () => {
  it('covers the chart while predicting until the teacher opens it', () => {
    render(
      <SceneLayout
        controls={<div />}
        viewport={<div />}
        dataOverlay={
          <p>
            <Answer>2.66 mm</Answer>
          </p>
        }
        chart={<div>P 点位移图</div>}
        chartVisible
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: '预测' }))
    expect(screen.queryByText('P 点位移图')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '图表含结论 · 点击显示' }))
    expect(screen.getByText('P 点位移图')).toBeInTheDocument()
  })

  afterEach(() => useAppStore.setState({ predicting: false }))

  it('offers 预测 only when the scene marks answers', () => {
    render(<SceneLayout controls={<div />} viewport={<div />} dataOverlay={<p>读数</p>} />)
    expect(screen.queryByRole('button', { name: '预测' })).not.toBeInTheDocument()
  })

  it('masks answers, reveals one on click and all on 全部揭晓, and masks again next round', () => {
    const data = renderWithAnswers()
    expect(data.getByText('0.50 V')).toBeInTheDocument()

    fireEvent.click(data.getByRole('button', { name: '预测' }))
    expect(data.queryByText('0.50 V')).not.toBeInTheDocument()
    expect(data.getByText('1.0 T')).toBeInTheDocument() // givens stay visible
    const masks = data.getAllByRole('button', { name: '?' })
    expect(masks).toHaveLength(2)

    fireEvent.click(masks[0])
    expect(data.getByText('0.50 V')).toBeInTheDocument()
    expect(data.queryByText('A → B')).not.toBeInTheDocument()

    fireEvent.click(data.getByRole('button', { name: '全部揭晓' }))
    expect(data.getByText('A → B')).toBeInTheDocument()

    // Off and on again starts a new round: everything is masked again.
    fireEvent.click(data.getByRole('button', { name: '预测' }))
    fireEvent.click(data.getByRole('button', { name: '预测' }))
    expect(data.getAllByRole('button', { name: '?' })).toHaveLength(2)
  })
})
