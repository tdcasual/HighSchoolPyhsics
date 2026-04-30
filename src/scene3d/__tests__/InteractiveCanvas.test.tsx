import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { InteractiveCanvas } from '../InteractiveCanvas'
import { useAppStore } from '../../store/useAppStore'

function setScenePath(path: string) {
  window.history.replaceState(null, '', path)
  useAppStore.setState({ activeScenePath: path })
}

describe('InteractiveCanvas classroom contract', () => {
  it('avoids importing the heavy demo route registry for touch metadata', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/scene3d/InteractiveCanvas.tsx'), 'utf8')

    expect(source).not.toMatch(/\.\.\/app\/demoRoutes/)
    expect(source).toMatch(/findRuntimeTouchProfile/)
  })

  beforeEach(() => {
    setScenePath('/oscilloscope')
  })

  afterEach(() => {
    setScenePath('/')
  })

  it('passes through presentation focus when no smart focus override is configured', () => {
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

    expect(screen.getByText(/3D演示预览/).closest('.canvas-fallback-stack')).toHaveAttribute('data-presentation-focus-mode', 'focus')
  })

  it('defaults to overview when no presentationFocus is provided', () => {
    render(
      <InteractiveCanvas camera={{ position: [0, 2, 6], fov: 42 }}>
        <mesh />
      </InteractiveCanvas>,
    )

    expect(screen.getByText(/3D演示预览/).closest('.canvas-fallback-stack')).toHaveAttribute('data-presentation-focus-mode', 'overview')
  })


  it('exposes the current route canvas gesture scope on the fallback surface', () => {
    setScenePath('/oscilloscope')

    render(
      <InteractiveCanvas camera={{ position: [0, 2, 6], fov: 42 }}>
        <mesh />
      </InteractiveCanvas>,
    )

    expect(screen.getByText(/3D演示预览/).closest('.canvas-fallback-stack')).toHaveAttribute('data-canvas-gesture-scope', 'interactive-canvas')
  })

  it('renders the current route touch-profile hint in the canvas fallback', () => {
    setScenePath('/oscilloscope')

    render(
      <InteractiveCanvas camera={{ position: [0, 2, 6], fov: 42 }}>
        <mesh />
      </InteractiveCanvas>,
    )

    expect(screen.getByText('拖拽旋转 · 滚轮缩放 · 右键平移 · 单指旋转 · 双指缩放/平移')).toBeInTheDocument()
  })
})
