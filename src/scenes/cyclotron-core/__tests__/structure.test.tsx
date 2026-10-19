import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../scene3d/InteractiveCanvas', () => ({ InteractiveCanvas: ({ children, frameloop }: { children: ReactNode; frameloop?: 'always' | 'demand' }) => <div data-testid="interactive-canvas" data-frameloop={frameloop ?? 'always'}>{children}</div> }))
vi.mock('../CyclotronCoreRig3D', () => ({ CyclotronCoreRig3D: () => <div data-testid="cyclotron-core-rig" /> }))

import { CyclotronCoreScene } from '../CyclotronCoreScene'

describe('cyclotron-core structure', () => {
  it('renders particle choices, telemetry, energy chart and playback', () => {
    render(<CyclotronCoreScene />)
    // Chart, playback (and some data) panels start collapsed; open them as a teacher would.
    screen.queryAllByRole('button', { name: '展开' }).forEach((button) => fireEvent.click(button))
    expect(screen.getByRole('heading', { name: '回旋加速器核心结构与原理' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /质子/ })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /氘核/ })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /α粒子/ })).toBeInTheDocument()
    expect(screen.getByText('动能增长与最大动能')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '回旋加速器粒子动能增长图' })).toBeInTheDocument()
    // The demo waits for the teacher to start the first acceleration.
    expect(screen.getByRole('button', { name: '开始加速' })).toBeInTheDocument()
    expect(screen.getByTestId('cyclotron-core-rig')).toBeInTheDocument()
    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'demand')
  })

  it('switches particle and pauses the animation', () => {
    render(<CyclotronCoreScene />)
    const deuteron = screen.getByRole('radio', { name: /氘核/ })
    fireEvent.click(deuteron)
    expect(deuteron).toHaveAttribute('aria-checked', 'true')
    // Chart, playback (and some data) panels start collapsed; open them as a teacher would.
    screen.queryAllByRole('button', { name: '展开' }).forEach((button) => fireEvent.click(button))
    fireEvent.click(screen.getByRole('button', { name: '开始加速' }))
    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'always')
    fireEvent.click(screen.getByRole('button', { name: '暂停轨迹' }))
    expect(screen.getByRole('button', { name: /继续轨迹|开始加速/ })).toBeInTheDocument()
    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'demand')
  })
})
