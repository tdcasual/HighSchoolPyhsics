import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../scene3d/InteractiveCanvas', () => ({ InteractiveCanvas: ({ children, frameloop }: { children: ReactNode; frameloop?: 'always' | 'demand' }) => <div data-testid="interactive-canvas" data-frameloop={frameloop ?? 'always'}>{children}</div> }))
vi.mock('../BinaryStarsRig3D', () => ({ BinaryStarsRig3D: () => <div data-testid="binary-stars-rig" /> }))

import { BinaryStarsScene } from '../BinaryStarsScene'

describe('binary-stars structure', () => {
  it('renders binary controls, telemetry, chart and playback', () => {
    render(<BinaryStarsScene />)
    expect(screen.getByRole('heading', { name: '双星系统动力学' })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: '星球 1 质量 m₁' })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: '星际总距离 L' })).toBeInTheDocument()
    expect(screen.getByText('核心规律')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '双星质量轨道半径关系图' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '暂停运动' })).toBeInTheDocument()
    expect(screen.getByTestId('binary-stars-rig')).toBeInTheDocument()
  })

  it('pauses the binary orbit and exposes the reset action', () => {
    render(<BinaryStarsScene />)
    fireEvent.click(screen.getByRole('button', { name: '暂停运动' }))
    expect(screen.getByRole('button', { name: '继续运动' })).toBeInTheDocument()
    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'demand')
    expect(screen.getByRole('button', { name: '重置参数' })).toBeInTheDocument()
  })
})
