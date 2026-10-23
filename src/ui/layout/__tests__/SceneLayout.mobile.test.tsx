import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import { SceneLayout } from '../SceneLayout'
import { HeaderActionsTargetContext } from '../headerActionsTarget'
import { MOBILE_BREAKPOINT } from '../../hooks/useMediaQuery'

const originalMatchMedia = window.matchMedia

function phoneScreen() {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: query === MOBILE_BREAKPOINT,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
  })
}

/** The app shell in miniature: a header slot the scene portals its playback buttons into. */
function Shell({ onPlay }: { onPlay: () => void }) {
  const [slot, setSlot] = useState<HTMLElement | null>(null)
  return (
    <HeaderActionsTargetContext.Provider value={slot}>
      <header role="banner">
        <span ref={setSlot} />
      </header>
      <SceneLayout
        controls={<p>参数内容</p>}
        dataOverlay={<p>读数内容</p>}
        chart={<p>波形内容</p>}
        chartVisible
        viewport={<div>canvas</div>}
        playbackActions={[
          { key: 'toggle-running', label: '播放', onClick: onPlay },
          { key: 'reset', label: '重置', onClick: () => {} },
        ]}
      />
    </HeaderActionsTargetContext.Provider>
  )
}

describe('SceneLayout on a phone', () => {
  beforeEach(phoneScreen)
  afterEach(() => {
    Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: originalMatchMedia })
  })

  it('puts the playback buttons in the app header, where Space and taps both reach them', () => {
    const onPlay = vi.fn()
    render(<Shell onPlay={onPlay} />)
    const header = screen.getByRole('banner')
    fireEvent.click(within(header).getByRole('button', { name: '播放' }))
    expect(within(header).getByRole('button', { name: '重置' })).toBeInTheDocument()
    fireEvent.keyDown(document.body, { key: ' ' })
    expect(onPlay).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('region', { name: '播放控制' })).not.toBeInTheDocument()
  })

  it('switches the bottom panel between 参数, 数据 and 图表', () => {
    render(<Shell onPlay={() => {}} />)
    expect(screen.getByText('参数内容')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: '图表' }))
    expect(screen.getByText('波形内容')).toBeInTheDocument()
    expect(screen.queryByText('参数内容')).not.toBeInTheDocument()
  })
})
