import type { ReactNode } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../scene3d/InteractiveCanvas', () => ({
  InteractiveCanvas: ({
    children,
    frameloop,
    camera,
    cameraUp,
    syncCamera,
  }: {
    children: ReactNode
    frameloop?: 'always' | 'demand'
    camera: { position: number[]; fov: number }
    cameraUp: number[]
    syncCamera: boolean
  }) => (
    <div
      data-testid="interactive-canvas"
      data-frameloop={frameloop ?? 'always'}
      data-camera-position={camera.position.join(',')}
      data-camera-up={cameraUp.join(',')}
      data-sync-camera={syncCamera}
    >
      {children}
    </div>
  ),
}))

vi.mock('../RotationalEmfRig3D', () => ({
  FRAME_FIELD_SHAFT_LENGTH: 5.4,
  ROD_FIELD_SHAFT_LENGTH: 2.8,
  ROTATIONAL_EMF_VISUAL_UNITS_PER_METER: 3.4,
  RotationalEmfRig3D: () => <div data-testid="rotational-emf-rig" />,
}))

import { RotationalEmfScene } from '../RotationalEmfScene'

describe('rotational-emf structure', () => {
  it('renders scenario controls, view toggles, and data overlay', () => {
    render(<RotationalEmfScene />)

    expect(screen.getByRole('heading', { name: '旋转切割磁感线控制' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '旋转导体棒' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '旋转矩形线框' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '主视图' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '俯视图' })).toBeInTheDocument()
    const canvas = screen.getByTestId('interactive-canvas')
    expect(canvas).toHaveAttribute('data-frameloop', 'demand')
    expect(canvas).toHaveAttribute('data-sync-camera', 'true')
    expect(canvas).toHaveAttribute('data-camera-up', '0,1,0')
    expect(
      within(screen.getByRole('region', { name: '数据' })).getByRole('button', { name: '折叠' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('region', { name: '播放控制' }).querySelector('button')).toHaveAttribute(
      'aria-label',
      '折叠',
    )
    expect(screen.getByText(/感应电动势/)).toBeInTheDocument()
    expect(screen.getByTestId('rotational-emf-rig')).toBeInTheDocument()
  })

  it('updates labels when switching scenario and view mode', () => {
    render(<RotationalEmfScene />)

    fireEvent.click(screen.getByRole('radio', { name: '旋转矩形线框' }))
    expect(screen.getAllByText(/旋转矩形线框/).length).toBeGreaterThanOrEqual(1)

    const mainCameraPosition = screen.getByTestId('interactive-canvas').getAttribute('data-camera-position')
    fireEvent.click(screen.getByRole('radio', { name: '俯视图' }))
    expect(screen.getAllByText(/俯视图/).length).toBeGreaterThanOrEqual(1)
    const topCanvas = screen.getByTestId('interactive-canvas')
    expect(topCanvas.getAttribute('data-camera-position')).not.toBe(mainCameraPosition)
    expect(topCanvas).toHaveAttribute('data-camera-up', '0,0,-1')
  })
})
