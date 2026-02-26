import { Suspense } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createPreloadableScene } from '../preloadableScene'

function SceneLabel({ label }: { label: string }) {
  return <p>{label}</p>
}

describe('createPreloadableScene', () => {
  it('retries preload after an initial import failure', async () => {
    let attempts = 0

    const scene = createPreloadableScene(async () => {
      attempts += 1
      if (attempts === 1) {
        throw new Error('network jitter')
      }
      return { default: () => <SceneLabel label="retry-success" /> }
    })

    await expect(scene.preload()).rejects.toThrow('network jitter')
    await expect(scene.preload()).resolves.toBeUndefined()
    expect(attempts).toBe(2)

    render(
      <Suspense fallback={<p>loading</p>}>
        <scene.Component />
      </Suspense>,
    )

    await waitFor(() => {
      expect(screen.getByText('retry-success')).toBeInTheDocument()
    })
  })

  it('reuses loaded module once preload succeeds', async () => {
    let attempts = 0

    const scene = createPreloadableScene(async () => {
      attempts += 1
      return { default: () => <SceneLabel label="stable" /> }
    })

    await scene.preload()
    await scene.preload()

    expect(attempts).toBe(1)
  })
})
