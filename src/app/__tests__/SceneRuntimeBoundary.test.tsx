import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactElement } from 'react'
import { SceneRuntimeBoundary } from '../SceneRuntimeBoundary'

function createRecoverableScene() {
  let shouldCrash = true

  const RecoverableScene = () => {
    if (shouldCrash) {
      throw new Error('scene-crash')
    }
    return <p>场景恢复成功</p>
  }

  return {
    RecoverableScene,
    recover: () => {
      shouldCrash = false
    },
  }
}

function AlwaysCrashScene(): ReactElement {
  throw new Error('always-crash')
}

describe('SceneRuntimeBoundary', () => {
  const originalConsoleError = console.error

  beforeEach(() => {
    console.error = vi.fn()
  })

  afterEach(() => {
    console.error = originalConsoleError
  })

  it('shows fallback card when scene render crashes and supports retry', async () => {
    const recoverableScene = createRecoverableScene()
    const onRetryScene = vi.fn()

    render(
      <SceneRuntimeBoundary
        scenePath="/oscilloscope"
        onBackToOverview={() => undefined}
        onRetryScene={onRetryScene}
      >
        <recoverableScene.RecoverableScene />
      </SceneRuntimeBoundary>,
    )

    expect(await screen.findByRole('heading', { name: '场景暂时不可用' })).toBeInTheDocument()

    recoverableScene.recover()
    fireEvent.click(screen.getByRole('button', { name: '重试场景' }))
    expect(onRetryScene).toHaveBeenCalledTimes(1)

    expect(await screen.findByText('场景恢复成功')).toBeInTheDocument()
  })

  it('returns to overview from fallback', async () => {
    const onBackToOverview = vi.fn()

    render(
      <SceneRuntimeBoundary scenePath="/cyclotron" onBackToOverview={onBackToOverview}>
        <AlwaysCrashScene />
      </SceneRuntimeBoundary>,
    )

    expect(await screen.findByRole('heading', { name: '场景暂时不可用' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '返回导航' }))
    expect(onBackToOverview).toHaveBeenCalledTimes(1)
  })

  it('clears error state after route path changes', async () => {
    const { rerender } = render(
      <SceneRuntimeBoundary scenePath="/mhd" onBackToOverview={() => undefined}>
        <AlwaysCrashScene />
      </SceneRuntimeBoundary>,
    )

    expect(await screen.findByRole('heading', { name: '场景暂时不可用' })).toBeInTheDocument()

    rerender(
      <SceneRuntimeBoundary scenePath="/oersted" onBackToOverview={() => undefined}>
        <p>新场景正常</p>
      </SceneRuntimeBoundary>,
    )

    await waitFor(() => {
      expect(screen.getByText('新场景正常')).toBeInTheDocument()
    })
  })
})
