import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from '../../../store/useAppStore'
import { PotentialEnergyScene } from '../PotentialEnergyScene'

function setViewportSize(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  })
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    writable: true,
    value: height,
  })
  window.dispatchEvent(new Event('resize'))
}

describe('potential-energy classroom mode', () => {
  beforeEach(() => {
    setViewportSize(1920, 1080)
    window.history.replaceState(null, '', '/potential-energy')
    useAppStore.setState({
      presentationMode: true,
      presentationRouteModes: { '/potential-energy': 'viewport' },
      activeScenePath: '/potential-energy',
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

  it('switches presentation focus to focus mode while surface rotation is building', async () => {
    render(<PotentialEnergyScene />)

    fireEvent.click(await screen.findByRole('button', { name: '显示控制面板' }))
    fireEvent.click(await screen.findByRole('button', { name: '1. 显示电势切片' }))
    fireEvent.click(await screen.findByRole('button', { name: '2. 开始旋转' }))

    expect(document.querySelector('[data-presentation-focus-mode="focus"]')).toBeInTheDocument()
  })

  it('keeps core summary visible and exposes presentation signal markers', async () => {
    render(<PotentialEnergyScene />)

    expect(await screen.findByRole('button', { name: '显示控制面板' })).toBeInTheDocument()
    const summary = await screen.findByRole('region', { name: '课堂核心信息' })
    expect(within(summary).getByText(/当前电荷:/)).toBeInTheDocument()
    expect(within(summary).getByText(/电势范围:/)).toBeInTheDocument()

    const signalNode = document.querySelector(
      '.potential-energy-readout[data-presentation-signal~="chart"][data-presentation-signal~="live-metric"]',
    )
    expect(signalNode).toBeInTheDocument()
    expect(document.querySelector('[data-presentation-focus-mode="overview"]')).toBeInTheDocument()
  })

  it('keeps desktop auto mode in split until staged rotation begins', async () => {
    useAppStore.setState({
      presentationMode: true,
      presentationRouteModes: {},
      activeScenePath: '/potential-energy',
    })

    const { container } = render(<PotentialEnergyScene />)

    await screen.findByText('电势图构建控制')

    expect(container.firstElementChild).toHaveAttribute('data-presentation-layout-decision', 'split')
    expect(screen.queryByRole('region', { name: '课堂核心信息' })).not.toBeInTheDocument()
  })
})
