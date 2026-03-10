import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
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
  it('renders classroom-facing controls, explanation text, and chart shell', () => {
    render(<ElectromagneticDriveScene />)

    expect(screen.getByText('电磁驱动控制')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '开始摇动' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '停止摇动' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '重置实验' })).toBeInTheDocument()
    expect(screen.getByText('实时转速对比')).toBeInTheDocument()
    expect(screen.getAllByText(/铝框产生感应电流并受力旋转/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'demand')
    expect(screen.getByTestId('electromagnetic-drive-rig')).toBeInTheDocument()
    expect(mockRig).toHaveBeenCalledWith(
      expect.objectContaining({
        magnetAngle: 0,
        frameAngle: 0,
      }),
    )
  })
})
