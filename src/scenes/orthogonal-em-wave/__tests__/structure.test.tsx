import type { ReactNode } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../scene3d/InteractiveCanvas', () => ({ InteractiveCanvas: ({ children, frameloop }: { children: ReactNode; frameloop?: 'always' | 'demand' }) => <div data-testid="interactive-canvas" data-frameloop={frameloop ?? 'always'}>{children}</div> }))
vi.mock('../OrthogonalEmWaveRig3D', () => ({ OrthogonalEmWaveRig3D: () => <div data-testid="orthogonal-em-wave-rig" /> }))

import { OrthogonalEmWaveScene } from '../OrthogonalEmWaveScene'

describe('orthogonal-em-wave structure', () => {
  it('renders view controls, telemetry, chart and playback', () => {
    render(<OrthogonalEmWaveScene />)
    expect(screen.getByRole('heading', { name: '正交电磁波模型' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '3D 空间立体' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'XY 侧视（看 E）' })).toBeInTheDocument()
    const dataPanel = screen.getByRole('region', { name: '数据' })
    expect(within(dataPanel).getByRole('button', { name: '折叠' })).toBeInTheDocument()
    expect(screen.getByText(/E ⟂ B，且 E×B 指向传播方向/)).toBeInTheDocument()
    const chartPanel = screen.getByRole('region', { name: '图表' })
    fireEvent.click(within(chartPanel).getByRole('button', { name: '展开' }))
    expect(screen.getByRole('img', { name: '电磁波电场与磁场空间分布图' })).toBeInTheDocument()
    const playbackPanel = screen.getByRole('region', { name: '播放控制' })
    expect(within(playbackPanel).getByRole('button', { name: '折叠' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '开始传播' })).toBeInTheDocument()
    expect(screen.getByTestId('orthogonal-em-wave-rig')).toBeInTheDocument()
    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'demand')
  })

  it('switches projection mode and pauses the animation', () => {
    render(<OrthogonalEmWaveScene />)
    const xy = screen.getByRole('radio', { name: 'XY 侧视（看 E）' })
    fireEvent.click(xy)
    expect(xy).toHaveAttribute('aria-checked', 'true')
    const playbackPanel = screen.getByRole('region', { name: '播放控制' })
    expect(within(playbackPanel).getByRole('button', { name: '折叠' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '开始传播' }))
    expect(screen.getByRole('button', { name: '暂停传播' })).toBeInTheDocument()
    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'always')
  })
})
