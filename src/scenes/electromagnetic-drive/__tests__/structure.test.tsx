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
  it('renders the experiment board inside the control panel and keeps the viewport focused on the apparatus', () => {
    const { container } = render(<ElectromagneticDriveScene />)

    const controlPanel = container.querySelector('.control-panel') as HTMLElement | null
    const viewportPanel = container.querySelector('.viewport-panel') as HTMLElement | null

    expect(controlPanel).toBeInTheDocument()
    expect(viewportPanel).toBeInTheDocument()
    expect(screen.getByText('电磁驱动控制')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '开始摇动' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '停止摇动' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '重置实验' })).toBeInTheDocument()

    expect(within(controlPanel as HTMLElement).getByText('实验看板')).toBeInTheDocument()
    expect(within(controlPanel as HTMLElement).getByText('实验状态')).toBeInTheDocument()
    expect(within(controlPanel as HTMLElement).getByText('实时转速对比')).toBeInTheDocument()
    expect(within(controlPanel as HTMLElement).getByText(/铝框产生感应电流并受力旋转/)).toBeInTheDocument()

    expect(container.querySelector('.electromagnetic-drive-stage-rail')).not.toBeInTheDocument()
    expect(viewportPanel?.querySelector('.electromagnetic-drive-telemetry')).not.toBeInTheDocument()
    expect(viewportPanel?.querySelector('.electromagnetic-drive-chart-card')).not.toBeInTheDocument()

    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'demand')
    expect(screen.getByTestId('electromagnetic-drive-rig')).toBeInTheDocument()
    expect(mockRig).toHaveBeenCalledWith(
      expect.objectContaining({
        magnetAngle: 0,
        frameAngle: 0,
      }),
    )
  })

  it('allows note and chart sections to collapse independently while preserving the chart signal shell', () => {
    const { container } = render(<ElectromagneticDriveScene />)

    const noteToggle = screen.getByRole('button', { name: '收起实验说明' })
    const chartToggle = screen.getByRole('button', { name: '收起转速图表' })

    expect(noteToggle).toHaveAttribute('aria-expanded', 'true')
    expect(chartToggle).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(noteToggle)
    expect(screen.getByRole('button', { name: '显示实验说明' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText(/异步跟随/)).not.toBeInTheDocument()

    fireEvent.click(chartToggle)
    expect(screen.getByRole('button', { name: '显示转速图表' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByText('图表已折叠，点击展开查看磁铁与铝框转速曲线。')).toBeInTheDocument()

    expect(
      container.querySelector(
        '.control-panel .electromagnetic-drive-chart-card[data-presentation-signal~="chart"]',
      ),
    ).toBeInTheDocument()
  })
})
