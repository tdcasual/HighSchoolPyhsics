import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { InteractiveCanvas } from '../InteractiveCanvas'
import { useAppStore } from '../../store/useAppStore'

function setScenePath(path: string) {
  window.history.replaceState(null, '', path)
  useAppStore.setState({ activeScenePath: path })
}

describe('InteractiveCanvas classroom contract', () => {
  beforeEach(() => {
    setScenePath('/oscilloscope')
  })

  afterEach(() => {
    setScenePath('/')
  })

  it('suppresses presentation focus when the active scene contract disables smart focus', () => {
    render(
      <InteractiveCanvas
        camera={{ position: [0, 2, 6], fov: 42 }}
        presentationFocus={{ mode: 'focus', primary: [2, 1, -1] }}
      >
        <mesh />
      </InteractiveCanvas>,
    )

    expect(screen.getByText(/3D演示预览/).closest('.canvas-fallback-stack')).toHaveAttribute('data-presentation-focus-mode', 'overview')
  })


  it('uses current browser path when activeScenePath has not synced yet', () => {
    window.history.replaceState(null, '', '/oscilloscope')
    useAppStore.setState({ activeScenePath: '/' })

    render(
      <InteractiveCanvas
        camera={{ position: [0, 2, 6], fov: 42 }}
        presentationFocus={{ mode: 'focus', primary: [2, 1, -1] }}
      >
        <mesh />
      </InteractiveCanvas>,
    )

    expect(screen.getByText(/3D演示预览/).closest('.canvas-fallback-stack')).toHaveAttribute('data-presentation-focus-mode', 'overview')
  })

  it('keeps presentation focus when the active scene contract enables smart focus', () => {
    setScenePath('/cyclotron')

    render(
      <InteractiveCanvas
        camera={{ position: [0, 2, 6], fov: 42 }}
        presentationFocus={{ mode: 'focus', primary: [2, 1, -1] }}
      >
        <mesh />
      </InteractiveCanvas>,
    )

    expect(screen.getByText(/3D演示预览/).closest('.canvas-fallback-stack')).toHaveAttribute('data-presentation-focus-mode', 'focus')
  })
})
