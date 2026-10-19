import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../scene3d/InteractiveCanvas', () => ({ InteractiveCanvas: ({ children, frameloop }: { children: ReactNode; frameloop?: 'always' | 'demand' }) => <div data-testid="interactive-canvas" data-frameloop={frameloop ?? 'always'}>{children}</div> }))
vi.mock('../EquipotentialDipoleRig3D', () => ({ EquipotentialDipoleRig3D: () => <div data-testid="equipotential-dipole-rig" /> }))

import { EquipotentialDipoleScene } from '../EquipotentialDipoleScene'

describe('equipotential-dipole structure', () => {
  it('renders dipole controls, SI telemetry and playback', () => {
    render(<EquipotentialDipoleScene />)
    expect(screen.getByRole('heading', { name: '等量异种电荷模型' })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: '间距 d' })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: '横坐标 x' })).toBeInTheDocument()
    expect(screen.getByText('合场强 |E|')).toBeInTheDocument()
    expect(screen.getByText('教师备注 · 模型与公式')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '暂停流动' })).toBeInTheDocument()
    expect(screen.getByTestId('equipotential-dipole-rig')).toBeInTheDocument()
  })

  it('updates the physical conclusion when the probe moves onto the perpendicular bisector', () => {
    render(<EquipotentialDipoleScene />)
    const probeX = screen.getByRole('slider', { name: '横坐标 x' })
    fireEvent.change(probeX, { target: { value: '0' } })
    fireEvent.pointerUp(probeX)
    expect(screen.getByText('中垂线上 E₁=E₂，V=0；合场强指向负电荷。')).toBeInTheDocument()
  })

  it('pauses field-line markers and toggles equipotential and vector layers', () => {
    render(<EquipotentialDipoleScene />)
    fireEvent.click(screen.getByRole('button', { name: '暂停流动' }))
    expect(screen.getByRole('button', { name: '继续流动' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('checkbox', { name: '显示等势线' }))
    expect(screen.getByRole('checkbox', { name: '显示等势线' })).not.toBeChecked()
    fireEvent.click(screen.getByRole('checkbox', { name: '显示 E₁、E₂ 与合场强 E' }))
    expect(screen.getByRole('checkbox', { name: '显示 E₁、E₂ 与合场强 E' })).not.toBeChecked()
  })
})
