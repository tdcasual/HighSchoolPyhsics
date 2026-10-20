import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'

vi.mock('../../../scene3d/InteractiveCanvas', () => ({
  InteractiveCanvas: ({
    camera,
    cameraUp,
    controls,
    syncCamera,
    children,
  }: {
    camera: { position?: [number, number, number] }
    cameraUp?: [number, number, number]
    controls?: { minPolarAngle?: number; maxPolarAngle?: number }
    syncCamera?: boolean
    children: ReactNode
  }) => (
    <div
      data-testid="interactive-canvas"
      data-camera-position={camera.position?.join(',') ?? ''}
      data-camera-up={cameraUp?.join(',') ?? ''}
      data-min-polar={String(controls?.minPolarAngle ?? '')}
      data-max-polar={String(controls?.maxPolarAngle ?? '')}
      data-sync-camera={String(syncCamera ?? false)}
    >
      {children}
    </div>
  ),
}))

vi.mock('../MotionalEmfRig3D', () => ({
  MotionalEmfRig3D: () => <div data-testid="motional-emf-rig" />,
}))

import { MotionalEmfScene } from '../MotionalEmfScene'

describe('motional-emf camera views', () => {
  it('offers default, top, and bottom view presets with full polar coverage', () => {
    render(<MotionalEmfScene />)

    const canvas = screen.getByTestId('interactive-canvas')
    expect(screen.getByRole('button', { name: '默认视角' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '俯视' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '底视' })).toBeInTheDocument()
    expect(canvas).toHaveAttribute('data-sync-camera', 'true')
    expect(canvas).toHaveAttribute('data-min-polar', '0')
    expect(canvas).toHaveAttribute('data-max-polar', String(Math.PI))

    fireEvent.click(screen.getByRole('button', { name: '俯视' }))
    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-camera-up', '0,0,-1')

    fireEvent.click(screen.getByRole('button', { name: '底视' }))
    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-camera-up', '0,0,1')
  })
})
