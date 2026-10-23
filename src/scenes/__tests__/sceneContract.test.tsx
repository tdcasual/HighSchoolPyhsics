import type { ComponentType } from 'react'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetAllSceneMemory } from '../../app/sceneMemory/sceneMemory'
import { useAppStore } from '../../store/useAppStore'
import { MAX_DATA_ROWS } from '../../ui/panels/DataRows'

/**
 * The classroom contract every scene keeps, checked on the real scene components (the 3D canvas
 * renders a placeholder under Vitest). Scene-specific behaviour stays in each scene's own tests.
 */

const modules = import.meta.glob<Record<string, unknown>>(['../*/*Scene.tsx'], { eager: true })
const sources = import.meta.glob<string>(
  ['../*/*.ts', '../*/*.tsx', '!../*/*.test.ts', '!../*/*.test.tsx', '!../__tests__/*'],
  {
    query: '?raw',
    import: 'default',
    eager: true,
  },
)

const SCENES: Array<[string, ComponentType]> = Object.entries(modules)
  .map(([path, module]): [string, ComponentType] => {
    const component = Object.entries(module).find(
      ([name, value]) => name.endsWith('Scene') && typeof value === 'function',
    )
    return [path.split('/')[1], component?.[1] as ComponentType]
  })
  .sort(([a], [b]) => a.localeCompare(b))

const sourceOf = (scene: string) =>
  Object.entries(sources)
    .filter(([path]) => path.split('/')[1] === scene)
    .map(([, text]) => text)
    .join('\n')

function expandPanels() {
  screen.queryAllByRole('button', { name: '展开' }).forEach((button) => fireEvent.click(button))
}

function dataRowCount(): number {
  const panel = screen.queryByRole('region', { name: '数据' })
  return panel ? panel.querySelectorAll('.scene-core-summary-stack > p').length : 0
}

function playback() {
  return screen.queryByRole('region', { name: '播放控制' })
}

function flushFrames() {
  // RangeField batches slider input into the next animation frame.
  act(() => {
    vi.advanceTimersByTime(50)
  })
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'setTimeout', 'clearTimeout'] })
  resetAllSceneMemory()
  useAppStore.setState({ predicting: false })
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  useAppStore.setState({ predicting: false })
})

describe.each(SCENES)('%s keeps the classroom contract', (scene, Scene) => {
  it('opens with 1–5 readings, and keeps to 5 in every sidebar mode', { timeout: 20_000 }, () => {
    render(<Scene />)
    expandPanels()
    expect(dataRowCount(), 'opening view').toBeGreaterThan(0)
    expect(dataRowCount(), 'opening view').toBeLessThanOrEqual(MAX_DATA_ROWS)
    const sidebar = screen.getByRole('complementary', { name: '参数控制' })
    const crowded: string[] = []
    for (const option of within(sidebar).queryAllByRole('radio')) {
      if (option.hasAttribute('disabled')) continue
      fireEvent.click(option)
      expandPanels()
      if (dataRowCount() > MAX_DATA_ROWS) crowded.push(`${option.textContent?.trim()}: ${dataRowCount()} rows`)
    }
    expect(crowded).toEqual([])
  })

  it('单步 leaves time paused, and reset works', () => {
    render(<Scene />)
    expandPanels()
    const zone = playback()
    const step = zone ? within(zone).queryByRole('button', { name: /^单步/ }) : null
    if (step && !step.hasAttribute('disabled')) {
      fireEvent.click(step)
      expect(within(zone!).queryByRole('button', { name: /^暂停/ })).toBeNull()
    }
    const reset = zone ? within(zone).queryByRole('button', { name: /重置/ }) : null
    if (reset && !reset.hasAttribute('disabled')) fireEvent.click(reset)
    expect(screen.getByRole('region', { name: '数据' })).toBeInTheDocument()
  })

  it('masks its conclusions in prediction mode (in whichever sidebar mode shows them)', { timeout: 20_000 }, () => {
    const marksAnswers = /answer:\s*true|<Answer\b/.test(sourceOf(scene))
    useAppStore.setState({ predicting: true })
    const { container } = render(<Scene />)
    expandPanels()
    let masked = container.querySelectorAll('.answer-mask').length
    const sidebar = screen.getByRole('complementary', { name: '参数控制' })
    for (const option of within(sidebar).queryAllByRole('radio')) {
      if (masked > 0 || option.hasAttribute('disabled')) break
      fireEvent.click(option)
      expandPanels()
      masked = container.querySelectorAll('.answer-mask').length
    }
    if (marksAnswers) expect(masked).toBeGreaterThan(0)
    else expect(masked).toBe(0)
  })

  it('remembers every teacher-set slider when the scene is opened again', () => {
    const first = render(<Scene />)
    const sidebar = screen.getByRole('complementary', { name: '参数控制' })
    const sliders = [
      ...sidebar.querySelectorAll<HTMLInputElement>('input[type="range"]:not([disabled]):not([data-transient])'),
    ]
    const chosen = new Map<string, number>()
    for (const slider of sliders) {
      const target = Number(slider.value) === Number(slider.min) ? slider.max : slider.min
      fireEvent.change(slider, { target: { value: target } })
      fireEvent.pointerUp(slider)
      flushFrames()
    }
    // Read back after all changes: one slider may legitimately clamp another (a range).
    for (const slider of sliders) {
      const live = first.container.querySelector<HTMLInputElement>(`#${CSS.escape(slider.id)}`)
      if (live) chosen.set(slider.id, Number(live.value))
    }
    first.unmount()
    const again = render(<Scene />)
    const forgotten = [...chosen].filter(
      ([id, value]) => Number(again.container.querySelector<HTMLInputElement>(`#${CSS.escape(id)}`)?.value) !== value,
    )
    expect(forgotten.map(([id]) => id)).toEqual([])
  })
})
