import type { ReactNode } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const { mockRig } = vi.hoisted(() => ({
  mockRig: vi.fn(),
}))

vi.mock('../../../scene3d/InteractiveCanvas', () => ({
  InteractiveCanvas: ({
    frameloop,
    children,
  }: {
    frameloop?: 'always' | 'demand'
    children: ReactNode
  }) => (
    <div data-testid="interactive-canvas" data-frameloop={frameloop ?? 'always'}>
      {children}
    </div>
  ),
}))

vi.mock('../ElectromagneticDriveRig3D', () => ({
  ElectromagneticDriveRig3D: (props: unknown) => {
    mockRig(props)
    return <div data-testid="electromagnetic-drive-rig" />
  },
}))

import { ElectromagneticDriveScene } from '../ElectromagneticDriveScene'

describe('electromagnetic-drive structure', () => {
  it('renders the control panel and viewport with apparatus', () => {
    render(<ElectromagneticDriveScene />)

    expect(screen.getByText('电磁驱动控制')).toBeInTheDocument()
    expect(screen.getByText('实验现象说明')).toBeInTheDocument()
    expect(screen.getByText('模型边界')).toBeInTheDocument()

    const dataPanel = screen.getByRole('region', { name: '数据' })
    const chartPanel = screen.getByRole('region', { name: '图表' })
    expect(within(dataPanel).getByRole('button', { name: '折叠' })).toBeInTheDocument()
    expect(within(chartPanel).getByRole('button', { name: '展开' })).toBeInTheDocument()
    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'demand')
    expect(screen.getByTestId('electromagnetic-drive-rig')).toBeInTheDocument()
    expect(mockRig).toHaveBeenCalledWith(
      expect.objectContaining({
        magnetAngle: 0,
        frameAngle: 0,
      }),
    )

    // Start/stop is one toggle in the playback panel, like every other scene.
    const playback = screen.getByRole('region', { name: '播放控制' })
    fireEvent.click(within(playback).getByRole('button', { name: '开始摇动' }))
    expect(within(playback).getByRole('button', { name: '停止摇动' })).toBeInTheDocument()
    expect(within(playback).getByRole('button', { name: '重置实验' })).toBeInTheDocument()
  })

  it('allows note section to collapse', () => {
    render(<ElectromagneticDriveScene />)

    const noteToggle = screen.getByRole('button', { name: /实验现象说明/ })
    expect(noteToggle).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(noteToggle)
    expect(screen.getByRole('button', { name: /实验现象说明/ })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText(/异步跟随/)).not.toBeInTheDocument()
  })

  it('单步 advances the cranked magnet 0.1 s and holds the instant, starting from rest', () => {
    render(<ElectromagneticDriveScene />)
    fireEvent.click(screen.getByRole('button', { name: '单步 0.1 s' }))
    expect(screen.getByText('定格（单步）')).toBeInTheDocument()
    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'demand')
    const speed = screen.getByText('磁铁转速').nextElementSibling!.textContent
    fireEvent.click(screen.getByRole('button', { name: '单步 0.1 s' }))
    expect(screen.getByText('磁铁转速').nextElementSibling!.textContent).not.toBe(speed)
    fireEvent.click(screen.getByRole('button', { name: '继续' }))
    expect(screen.getByText('摇动中')).toBeInTheDocument()
  })
})
