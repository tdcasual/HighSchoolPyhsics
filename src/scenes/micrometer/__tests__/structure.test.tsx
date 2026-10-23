import type { ReactNode } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '../../../store/useAppStore'

const canvasProps: { current: Record<string, unknown> | null } = { current: null }

vi.mock('../../../scene3d/InteractiveCanvas', () => ({
  InteractiveCanvas: ({ children, frameloop, ...props }: { children: ReactNode; frameloop?: 'always' | 'demand' }) => {
    canvasProps.current = { ...props, frameloop }
    return (
      <div data-testid="interactive-canvas" data-frameloop={frameloop ?? 'always'}>
        {children}
      </div>
    )
  },
}))

vi.mock('../MicrometerRig3D', () => ({
  MicrometerRig3D: () => <div data-testid="micrometer-rig" />,
}))

import { MicrometerScene } from '../MicrometerScene'

describe('micrometer structure', () => {
  beforeEach(() => {
    sessionStorage.clear()
    useAppStore.setState({ predicting: false })
  })

  it('opens with the thimble reading figure, zero error and teacher notes', () => {
    render(<MicrometerScene />)
    expect(screen.getByRole('heading', { name: '螺旋测微器控制' })).toBeInTheDocument()
    expect(
      within(screen.getByRole('region', { name: '图表' })).getByRole('img', { name: '螺旋测微器读数放大' }),
    ).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: '数据' })).getByText('5.237 mm')).toBeInTheDocument()
    expect(screen.getByText(/螺距 0.5 mm/)).toBeInTheDocument()
    expect((canvasProps.current?.controls as { minDistance: number }).minDistance).toBe(40)
  })

  it('keeps the camera still while the thimble turns', () => {
    render(<MicrometerScene />)
    const before = [...(canvasProps.current?.camera as { position: number[] }).position]
    fireEvent.click(screen.getByRole('button', { name: '+0.5' }))
    fireEvent.click(screen.getByRole('button', { name: '+0.5' }))
    expect(within(screen.getByRole('region', { name: '数据' })).getByText('6.237 mm')).toBeInTheDocument()
    expect((canvasProps.current?.camera as { position: number[] }).position).toEqual(before)
  })

  it('turns one division from the playback panel and the arrow keys', () => {
    render(<MicrometerScene />)
    const data = screen.getByRole('region', { name: '数据' })
    fireEvent.click(within(screen.getByRole('region', { name: '播放控制' })).getByRole('button', { name: '+0.01 mm' }))
    expect(within(data).getByText('5.247 mm')).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(within(data).getByText('5.227 mm')).toBeInTheDocument()
  })

  it('shows the indicated value, gap plus zero error', () => {
    render(<MicrometerScene />)
    fireEvent.change(screen.getByLabelText(/零点误差/), { target: { value: '0.02' } })
    fireEvent.pointerUp(screen.getByLabelText(/零点误差/))
    expect(within(screen.getByRole('region', { name: '数据' })).getByText('+0.020 mm')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: '数据' })).getByText('5.257 mm')).toBeInTheDocument()
  })
})
