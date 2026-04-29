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
    expect(screen.getByRole('button', { name: '开始摇动' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '停止摇动' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '重置实验' })).toBeInTheDocument()
    expect(screen.getByText('实验现象说明')).toBeInTheDocument()

    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'demand')
    expect(screen.getByTestId('electromagnetic-drive-rig')).toBeInTheDocument()
    expect(mockRig).toHaveBeenCalledWith(
      expect.objectContaining({
        magnetAngle: 0,
        frameAngle: 0,
      }),
    )
  })

  it('allows note section to collapse', () => {
    render(<ElectromagneticDriveScene />)

    const noteToggle = screen.getByRole('button', { name: '收起实验说明' })
    expect(noteToggle).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(noteToggle)
    expect(screen.getByRole('button', { name: '显示实验说明' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText(/异步跟随/)).not.toBeInTheDocument()
  })
})
