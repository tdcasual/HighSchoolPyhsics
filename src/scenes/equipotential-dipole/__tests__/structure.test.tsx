import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../scene3d/InteractiveCanvas', () => ({ InteractiveCanvas: ({ children, frameloop }: { children: ReactNode; frameloop?: 'always' | 'demand' }) => <div data-testid="interactive-canvas" data-frameloop={frameloop ?? 'always'}>{children}</div> }))
vi.mock('../EquipotentialDipoleRig3D', () => ({ EquipotentialDipoleRig3D: () => <div data-testid="equipotential-dipole-rig" /> }))

import { EquipotentialDipoleScene } from '../EquipotentialDipoleScene'

describe('equipotential-dipole structure', () => {
  it('renders dipole controls, telemetry and playback', () => {
    render(<EquipotentialDipoleScene />)
    expect(screen.getByRole('heading', { name: '等量异种电荷模型' })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: '间距 d' })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: '横坐标 x' })).toBeInTheDocument()
    expect(screen.getByText('合场强 |E|')).toBeInTheDocument()
    expect(screen.getByText('物理结论')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '暂停流动' })).toBeInTheDocument()
    expect(screen.getByTestId('equipotential-dipole-rig')).toBeInTheDocument()
  })

  it('pauses flowing field lines and updates the probe readout', () => {
    render(<EquipotentialDipoleScene />)
    fireEvent.click(screen.getByRole('button', { name: '暂停流动' }))
    expect(screen.getByRole('button', { name: '继续流动' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('checkbox', { name: '显示合成分解（E）' }))
    expect(screen.getByRole('checkbox', { name: '显示合成分解（E）' })).not.toBeChecked()
  })
})
