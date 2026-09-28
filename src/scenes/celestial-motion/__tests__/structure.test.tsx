import type { ReactNode } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const canvasProps: { current: Record<string, unknown> | null } = { current: null }

vi.mock('../../../scene3d/InteractiveCanvas', () => ({
  InteractiveCanvas: ({ children, ...props }: { children: ReactNode }) => {
    canvasProps.current = props
    return <div data-testid="interactive-canvas">{children}</div>
  },
}))

vi.mock('../CelestialRig3D', () => ({
  CelestialRig3D: () => <div data-testid="celestial-rig" />,
}))

import { CelestialScene } from '../CelestialScene'

function expandPanel(name: string) {
  const panel = screen.getByRole('region', { name })
  fireEvent.click(within(panel).getByRole('button', { name: '展开' }))
  return panel
}

function readout() {
  return screen.getByText('中心天体 / M').closest('p')?.parentElement
}

describe('celestial structure', () => {
  it('opens on a fitted circular Earth orbit with unobstructed panels', () => {
    render(<CelestialScene />)
    expect(screen.getByRole('heading', { name: '天体运动控制' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '圆轨道' })).toBeInTheDocument()
    const data = expandPanel('数据')
    expect(data).toHaveTextContent('地球')
    expect(data).toHaveTextContent('1.10 R')
    expect(data).toHaveTextContent('v₁ 7.910 km/s')
    const playback = screen.getByRole('region', { name: '播放控制' })
    expect(within(playback).getByRole('button', { name: '展开' })).toBeInTheDocument()
    expect(expandPanel('图表')).toContainElement(screen.getByRole('img', { name: '轨道平面图' }))
    expect(screen.getByTestId('celestial-rig')).toBeInTheDocument()

    const camera = canvasProps.current?.camera as { fov: number; position: number[] }
    const controls = canvasProps.current?.controls as {
      minDistance: number
      maxDistance: number
      target: number[]
      minPolarAngle: number
      maxPolarAngle: number
    }
    expect(camera.fov).toBe(32)
    expect(controls.minDistance).toBe(6)
    expect(controls.maxDistance).toBeGreaterThan(26)
    expect(controls.target).not.toEqual([0, 0, 0])
    expect(controls.minPolarAngle).toBeCloseTo((16 * Math.PI) / 180)
    expect(controls.maxPolarAngle).toBeCloseTo((74 * Math.PI) / 180)
    expect(canvasProps.current?.adaptiveFraming).toBe(false)
  })

  it('switches to a stationary satellite and advances a Hohmann transfer', () => {
    render(<CelestialScene />)
    expandPanel('数据')
    fireEvent.click(screen.getByRole('radio', { name: '静止' }))
    expect(readout()).toHaveTextContent('6.62 R')
    expect(readout()).toHaveTextContent('静止卫星')
    expect(expandPanel('图表')).toContainElement(screen.getByRole('img', { name: '星下点轨迹' }))

    fireEvent.click(screen.getByRole('radio', { name: '变轨' }))
    expect(readout()).toHaveTextContent(/转移进度\s*0%/)
    const playback = screen.getByRole('region', { name: '播放控制' })
    fireEvent.click(within(playback).getByRole('button', { name: '展开' }))
    fireEvent.click(within(playback).getByRole('button', { name: '单步' }))
    expect(readout()).toHaveTextContent(/转移进度\s*3%/)
  })
})
