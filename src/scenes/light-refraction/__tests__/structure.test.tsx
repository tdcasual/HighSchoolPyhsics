import type { ReactNode } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../scene3d/InteractiveCanvas', () => ({
  InteractiveCanvas: ({ children, frameloop }: { children: ReactNode; frameloop?: string }) => (
    <div data-testid="interactive-canvas" data-frameloop={frameloop}>{children}</div>
  ),
}))
vi.mock('../LightRefractionRig3D', () => ({ LightRefractionRig3D: () => <div data-testid="refraction-rig" /> }))

import { LightRefractionScene } from '../LightRefractionScene'

describe('light-refraction structure', () => {
  it('air → glass at 30°: r ≈ 19.5° and no critical angle', () => {
    render(<LightRefractionScene />)
    const data = within(screen.getByRole('region', { name: '数据' }))
    expect(data.getByText('19.5°')).toBeInTheDocument()
    expect(data.getByText('无（光由光疏射入光密）')).toBeInTheDocument()
    expect(data.getByText('反射 + 折射')).toBeInTheDocument()
  })

  it('glass → air: stepping the angle past 41.8° gives total internal reflection', () => {
    render(<LightRefractionScene />)
    fireEvent.click(screen.getByRole('button', { name: '玻璃 → 空气' }))
    const data = within(screen.getByRole('region', { name: '数据' }))
    expect(data.getByText('41.8°')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '单步 +5°' })) // 35°
    fireEvent.click(screen.getByRole('button', { name: '单步 +5°' })) // 40°
    expect(data.getByText('反射 + 折射')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '单步 +5°' })) // 45°
    expect(data.getByText('全反射')).toBeInTheDocument()
    expect(data.getByText('无（全反射）')).toBeInTheDocument()
    expect(data.getByText('100.0%')).toBeInTheDocument()
  })
})
