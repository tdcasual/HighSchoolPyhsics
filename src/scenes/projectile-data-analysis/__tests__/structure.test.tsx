import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
vi.mock('../../../scene3d/InteractiveCanvas', () => ({ InteractiveCanvas: ({ children, frameloop }: { children: ReactNode; frameloop?: 'always' | 'demand' }) => <div data-testid="interactive-canvas" data-frameloop={frameloop ?? 'always'}>{children}</div> }))
vi.mock('../ProjectileDataAnalysisRig3D', () => ({ ProjectileDataAnalysisRig3D: () => <div data-testid="projectile-data-analysis-rig" /> }))
import { ProjectileDataAnalysisScene } from '../ProjectileDataAnalysisScene'
describe('projectile-data-analysis structure', () => {
  it('renders mode controls, telemetry, chart and playback', () => { render(<ProjectileDataAnalysisScene />); expect(screen.getByRole('heading', { name: '平抛实验数据还原与轨迹分析' })).toBeInTheDocument(); expect(screen.getByRole('radio', { name: '频闪实验数据还原' })).toBeInTheDocument(); expect(screen.getByRole('slider', { name: '初速度 v₀' })).toBeInTheDocument(); expect(screen.getByText('Δx/T = 2.00 m/s')).toBeInTheDocument(); expect(screen.getByRole('img', { name: '平抛运动轨迹与频闪数据图' })).toBeInTheDocument(); expect(screen.getByRole('button', { name: '暂停运动' })).toBeInTheDocument(); expect(screen.getByTestId('projectile-data-analysis-rig')).toBeInTheDocument() })
  it('switches to force analysis and pauses the trajectory', () => { render(<ProjectileDataAnalysisScene />); fireEvent.click(screen.getByRole('radio', { name: '轨迹与分运动' })); expect(screen.getByText('水平：')).toBeInTheDocument(); fireEvent.click(screen.getByRole('button', { name: '暂停运动' })); expect(screen.getByRole('button', { name: '继续运动' })).toBeInTheDocument(); expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'demand') })
})
