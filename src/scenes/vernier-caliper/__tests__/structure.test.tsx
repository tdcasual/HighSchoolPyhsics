import type { ReactNode } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '../../../store/useAppStore'

const canvasProps: { current: Record<string, unknown> | null } = { current: null }

vi.mock('../../../scene3d/InteractiveCanvas', () => ({
  InteractiveCanvas: ({ children, frameloop, ...props }: { children: ReactNode; frameloop?: 'always' | 'demand' }) => {
    canvasProps.current = { ...props, frameloop }
    return <div data-testid="interactive-canvas" data-frameloop={frameloop ?? 'always'}>{children}</div>
  },
}))

vi.mock('../CaliperRig3D', () => ({
  CaliperRig3D: () => <div data-testid="caliper-rig" />,
}))

import { CaliperScene } from '../CaliperScene'

function cameraRadius() {
  const camera = canvasProps.current?.camera as { position: number[] }
  const controls = canvasProps.current?.controls as { target: number[] }
  return Math.hypot(...camera.position.map((value, index) => value - controls.target[index]))
}

describe('vernier-caliper structure', () => {
  beforeEach(() => {
    sessionStorage.clear()
    useAppStore.setState({ predicting: false })
  })

  it('opens on the 20-division caliper with the exam-style reading figure and teacher notes', () => {
    render(<CaliperScene />)
    expect(screen.getByRole('heading', { name: '游标卡尺控制' })).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: '图表' })).getByRole('img', { name: '游标卡尺读数放大' })).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: '数据' })).getByText('23.45 mm')).toBeInTheDocument()
    expect(screen.getByText(/游标卡尺不估读/)).toBeInTheDocument()
    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'demand')
    expect(canvasProps.current?.syncCamera).toBe(true)
    const controls = canvasProps.current?.controls as { minDistance: number; maxDistance: number }
    expect(controls.minDistance).toBe(70)
    expect(controls.maxDistance).toBeGreaterThan(cameraRadius() * 1.19)
  })

  it('steps one precision from the playback panel and the arrow keys', () => {
    render(<CaliperScene />)
    const data = screen.getByRole('region', { name: '数据' })
    const playback = screen.getByRole('region', { name: '播放控制' })
    fireEvent.click(within(playback).getByRole('button', { name: '+0.05 mm' }))
    expect(within(data).getByText('23.50 mm')).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(within(data).getByText('23.55 mm')).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    fireEvent.keyDown(window, { key: ',' })
    expect(within(data).getByText('23.45 mm')).toBeInTheDocument()
    fireEvent.click(within(playback).getByRole('button', { name: '锁紧' }))
    expect(within(playback).getByRole('button', { name: '+0.05 mm' })).toBeDisabled()
  })

  it('snaps to the vernier precision when the division changes', () => {
    render(<CaliperScene />)
    fireEvent.click(screen.getByRole('radio', { name: '10 分度' }))
    fireEvent.click(within(screen.getByRole('region', { name: '播放控制' })).getByRole('button', { name: '+0.1 mm' }))
    expect(within(screen.getByRole('region', { name: '数据' })).getByText('23.6 mm')).toBeInTheDocument()
  })

  it('refits the camera for a new view preset and animates a commanded reading', () => {
    render(<CaliperScene />)
    const before = [...(canvasProps.current?.camera as { position: number[] }).position]
    fireEvent.click(screen.getByRole('radio', { name: '俯视' }))
    expect((canvasProps.current?.camera as { position: number[] }).position).not.toEqual(before)
    fireEvent.click(screen.getByRole('button', { name: '调到该读数' }))
    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'always')
  })

  it('masks the reading in prediction mode but keeps the scale figure to read from', () => {
    useAppStore.setState({ predicting: true })
    render(<CaliperScene />)
    const data = screen.getByRole('region', { name: '数据' })
    expect(within(data).queryByText('23.45 mm')).not.toBeInTheDocument()
    const chart = screen.getByRole('region', { name: '图表' })
    expect(within(chart).getByRole('img', { name: '游标卡尺读数放大' })).toBeInTheDocument()
    expect(within(chart).getByTestId('caliper-reading')).toHaveTextContent('读数在判定后显示')
  })
})
