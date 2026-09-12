import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../scene3d/InteractiveCanvas', () => ({ InteractiveCanvas: ({ children, frameloop }: { children: ReactNode; frameloop?: 'always' | 'demand' }) => <div data-testid="interactive-canvas" data-frameloop={frameloop ?? 'always'}>{children}</div> }))
vi.mock('../SameChargeRig3D', () => ({ SameChargeRig3D: () => <div data-testid="same-charge-rig" /> }))

import { SameChargeScene } from '../SameChargeScene'

describe('same-charge structure', () => {
  it('renders polarity controls, telemetry, chart and playback', () => {
    render(<SameChargeScene />)
    expect(screen.getByRole('heading', { name: '等量同种电荷场' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '正电荷 (+)' })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: '电荷间距 2d' })).toBeInTheDocument()
    expect(screen.getByText('空间电势 φ')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '等量同种电荷中垂线场强关系图' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '暂停流动' })).toBeInTheDocument()
    expect(screen.getByTestId('same-charge-rig')).toBeInTheDocument()
  })

  it('pauses and resets the probe state', () => {
    render(<SameChargeScene />)
    fireEvent.click(screen.getByRole('button', { name: '暂停流动' }))
    expect(screen.getByRole('button', { name: '继续流动' })).toBeInTheDocument()
    const probeX = screen.getByRole('slider', { name: '横坐标 x' })
    fireEvent.change(probeX, { target: { value: '2' } })
    fireEvent.pointerUp(probeX)
    expect(screen.getByText('(2.0, 2.8)')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '重置探针' }))
    expect(screen.getByText('(0.0, 2.8)')).toBeInTheDocument()
  })
})
