import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../scene3d/InteractiveCanvas', () => ({ InteractiveCanvas: ({ children, frameloop }: { children: ReactNode; frameloop?: 'always' | 'demand' }) => <div data-testid="interactive-canvas" data-frameloop={frameloop ?? 'always'}>{children}</div> }))
vi.mock('../FaradayDiscRig3D', () => ({ FaradayDiscRig3D: () => <div data-testid="faraday-disc-rig" /> }))

import { FaradayDiscScene } from '../FaradayDiscScene'

describe('faraday-disc structure', () => {
  it('renders disc controls, telemetry, chart and playback', () => {
    render(<FaradayDiscScene />)
    expect(screen.getByRole('heading', { name: '法拉第圆盘发电机实验装置' })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: '磁感应强度 B' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '闭合回路' })).toBeInTheDocument()
    expect(screen.getByText('能量关系')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '法拉第圆盘感应电动势角速度图' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '暂停转动' })).toBeInTheDocument()
    expect(screen.getByTestId('faraday-disc-rig')).toBeInTheDocument()
  })

  it('opens the circuit and pauses the disc', () => {
    render(<FaradayDiscScene />)
    fireEvent.click(screen.getByRole('radio', { name: '断开开关' }))
    expect(screen.getByText('断开：圆心—边缘保持电势差，外电路无持续电流。')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '暂停转动' }))
    expect(screen.getByRole('button', { name: '继续转动' })).toBeInTheDocument()
    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'demand')
  })
})
