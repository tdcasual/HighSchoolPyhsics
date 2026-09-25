import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
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

function readout() {
  return screen.getByText('天体').closest('p')?.parentElement
}

describe('celestial structure', () => {
  it('opens on a circular Earth orbit with the wide camera budget', () => {
    render(<CelestialScene />)
    expect(screen.getByRole('heading', { name: '天体运动控制' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '圆轨道' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '轨道平面图' })).toBeInTheDocument()
    expect(screen.getByTestId('celestial-rig')).toBeInTheDocument()
    expect(readout()).toHaveTextContent('地球')
    expect(readout()).toHaveTextContent('1.10 R')
    expect(readout()).toHaveTextContent('v₁ 7.910 km/s')
    const camera = canvasProps.current?.camera as { fov: number }
    const controls = canvasProps.current?.controls as { minDistance: number; maxDistance: number; target: number[] }
    expect(camera.fov).toBe(32)
    expect(controls.minDistance).toBe(6)
    expect(controls.maxDistance).toBe(26)
    expect(controls.target).toEqual([0, 0, 0])
    expect(canvasProps.current?.adaptiveFraming).toBe(false)
  })

  it('switches to a stationary satellite and steps a transfer', () => {
    render(<CelestialScene />)
    fireEvent.click(screen.getByRole('radio', { name: '静止' }))
    expect(readout()).toHaveTextContent('6.62 R')
    expect(readout()).toHaveTextContent('静止卫星')
    expect(screen.getByRole('img', { name: '星下点轨迹' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: '变轨' }))
    expect(readout()).toHaveTextContent('进度 0%')
    fireEvent.click(screen.getByRole('button', { name: '单步' }))
    expect(readout()).toHaveTextContent('进度 3%')
  })
})