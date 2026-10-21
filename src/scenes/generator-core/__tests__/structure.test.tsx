import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { GeneratorCoreScene } from '../GeneratorCoreScene'

describe('generator-core structure', () => {
  it('renders the model, telemetry, phase chart and playback actions', () => {
    render(<GeneratorCoreScene />)
    // Chart, playback (and some data) panels start collapsed; open them as a teacher would.
    screen.queryAllByRole('button', { name: '展开' }).forEach((button) => fireEvent.click(button))
    expect(screen.getByRole('heading', { name: '正弦式交变电流：发电机核心模型' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '模型结构' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '相位分析' })).toBeInTheDocument()
    expect(screen.getByText('磁通量与感应电动势')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '发电机磁通量和感应电动势相位图' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '暂停旋转' })).toBeInTheDocument()
    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'always')
    expect(screen.getAllByText(/中性面|平行面|过渡位置/).length).toBeGreaterThan(0)
  })

  it('switches to phase analysis and pauses the animation', () => {
    render(<GeneratorCoreScene />)
    fireEvent.click(screen.getByRole('radio', { name: '相位分析' }))
    expect(screen.getByText(/磁通量 Φ = Φₘ cosθ/)).toBeInTheDocument()
    // Chart, playback (and some data) panels start collapsed; open them as a teacher would.
    screen.queryAllByRole('button', { name: '展开' }).forEach((button) => fireEvent.click(button))
    fireEvent.click(screen.getByRole('button', { name: '暂停旋转' }))
    expect(screen.getByRole('button', { name: '继续旋转' })).toBeInTheDocument()
    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'demand')
  })
})

