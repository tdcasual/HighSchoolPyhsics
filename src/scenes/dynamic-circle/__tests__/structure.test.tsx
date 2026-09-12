import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../scene3d/InteractiveCanvas', () => ({
  InteractiveCanvas: ({ children, frameloop }: { children: ReactNode; frameloop?: 'always' | 'demand' }) => <div data-testid="interactive-canvas" data-frameloop={frameloop ?? 'always'}>{children}</div>,
}))
vi.mock('../DynamicCircleRig3D', () => ({ DynamicCircleRig3D: () => <div data-testid="dynamic-circle-rig" /> }))

import { DynamicCircleScene } from '../DynamicCircleScene'

describe('dynamic-circle structure', () => {
  it('renders the four methods, boundary controls, telemetry, chart and playback', () => {
    render(<DynamicCircleScene />)
    expect(screen.getByRole('heading', { name: '动态圆 · 三法破临界' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '放缩圆' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '旋转圆' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '平移圆' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '综合聚焦' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '直线/矩形' })).toBeInTheDocument()
    expect(screen.getByText('轨道半径与临界分析')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '动态圆轨道半径分析图' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '暂停轨迹' })).toBeInTheDocument()
    expect(screen.getByTestId('dynamic-circle-rig')).toBeInTheDocument()
    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'always')
  })

  it('reveals mode-specific controls and pauses the animation', () => {
    render(<DynamicCircleScene />)
    fireEvent.click(screen.getByRole('radio', { name: '旋转圆' }))
    expect(screen.getByLabelText('入射夹角 θ')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: '三角形' }))
    expect(screen.getByLabelText('右顶点 x')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '暂停轨迹' }))
    expect(screen.getByRole('button', { name: '继续轨迹' })).toBeInTheDocument()
    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'demand')
  })
})
