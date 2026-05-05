import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../../App'
import { useAppStore } from '../../store/useAppStore'

function navigateToScene(sceneName: string) {
  fireEvent.click(screen.getByRole('button', { name: '返回导航' }))
  fireEvent.click(screen.getByText(sceneName))
}

describe('3d interaction policy', () => {
  beforeEach(() => {
    useAppStore.setState({ theme: 'day' })
    window.history.replaceState(null, '', '/oscilloscope')
  })

  it('shows drag/zoom interaction hint in both demos', async () => {
    render(<App />)
    const asyncWait = { timeout: 3000 }

    expect(await screen.findByText(/拖拽旋转/, {}, asyncWait)).toBeInTheDocument()
    expect(await screen.findByText(/滚轮缩放/, {}, asyncWait)).toBeInTheDocument()

    navigateToScene('回旋加速器')
    expect(await screen.findByText(/拖拽旋转/, {}, asyncWait)).toBeInTheDocument()
    expect(await screen.findByText(/滚轮缩放/, {}, asyncWait)).toBeInTheDocument()

    navigateToScene('磁流体发电机')
    expect(await screen.findByText(/拖拽旋转/, {}, asyncWait)).toBeInTheDocument()
    expect(await screen.findByText(/滚轮缩放/, {}, asyncWait)).toBeInTheDocument()

    navigateToScene('奥斯特实验')
    expect(await screen.findByText(/拖拽旋转/, {}, asyncWait)).toBeInTheDocument()
    expect(await screen.findByText(/滚轮缩放/, {}, asyncWait)).toBeInTheDocument()
  })
})
