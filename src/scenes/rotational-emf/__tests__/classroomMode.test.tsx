import type { ReactNode } from 'react'
import { render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '../../../store/useAppStore'

vi.mock('../../../scene3d/InteractiveCanvas', () => ({
  InteractiveCanvas: ({ children }: { children: ReactNode }) => <div data-testid="interactive-canvas">{children}</div>,
}))

vi.mock('../RotationalEmfRig3D', () => ({
  RotationalEmfRig3D: () => <div data-testid="rotational-emf-rig" />,
}))

import { RotationalEmfScene } from '../RotationalEmfScene'

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  })
  window.dispatchEvent(new Event('resize'))
}

describe('rotational-emf classroom mode', () => {
  beforeEach(() => {
    setViewportWidth(1366)
    window.history.replaceState(null, '', '/rotational-emf')
    useAppStore.setState({
      presentationMode: true,
      presentationRouteModes: { '/rotational-emf': 'viewport' },
      activeScenePath: '/rotational-emf',
    })
  })

  afterEach(() => {
    window.history.replaceState(null, '', '/')
    useAppStore.setState({
      presentationMode: false,
      presentationRouteModes: {},
      activeScenePath: '/',
    })
  })

  it('keeps the classroom summary visible and exposes the emf readout signal marker', async () => {
    render(<RotationalEmfScene />)

    expect(await screen.findByRole('button', { name: '显示控制面板' })).toBeInTheDocument()
    const summary = await screen.findByRole('region', { name: '课堂核心信息' })
    expect(within(summary).getByText(/实验类型:/)).toBeInTheDocument()
    expect(within(summary).getByText(/当前视图:/)).toBeInTheDocument()
    expect(within(summary).getByText(/当前转角:/)).toBeInTheDocument()
    expect(within(summary).getByText(/感应电动势:/)).toBeInTheDocument()

    const signalNode = document.querySelector(
      '.rotational-emf-readout[data-presentation-signal~="live-metric"][data-presentation-signal~="interactive-readout"]',
    )
    expect(signalNode).toBeInTheDocument()
  })
})
