import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { createRef } from 'react'
import { FloatingPanel } from '../FloatingPanel'

describe('FloatingPanel forwardRef', () => {
  it('forwards ref to outer div', () => {
    const ref = createRef<HTMLDivElement>()
    render(
      <FloatingPanel title="test" defaultPosition={{ x: 0, y: 0 }} ref={ref}>
        content
      </FloatingPanel>,
    )
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
    expect(ref.current).toHaveAttribute('role', 'region')
  })

  it('supports callback ref', () => {
    const ref = vi.fn()
    render(
      <FloatingPanel title="test" defaultPosition={{ x: 0, y: 0 }} ref={ref}>
        content
      </FloatingPanel>,
    )
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLDivElement))
  })
})
