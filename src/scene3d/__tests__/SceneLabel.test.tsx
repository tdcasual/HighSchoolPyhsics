import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { SceneLabel } from '../SceneLabel'

// drei's Html needs a running R3F canvas; the label's own markup is what is under test.
vi.mock('@react-three/drei/web/Html', () => ({
  Html: ({ children }: { children: ReactNode }) => <div data-testid="html">{children}</div>,
}))

describe('SceneLabel', () => {
  it('styles a part name as a tag by default', () => {
    render(<SceneLabel position={[0, 0, 0]}>弹性振片</SceneLabel>)
    expect(screen.getByText('弹性振片')).toHaveClass('scene-label', 'scene-label--tag')
  })

  it('colours the text of an annotation and darkens its halo on request', () => {
    render(
      <SceneLabel position={[0, 0, 0]} variant="text" color="#9c27b0" size={13} halo="dark">
        法向量 n
      </SceneLabel>,
    )
    const label = screen.getByText('法向量 n')
    expect(label).toHaveClass('scene-label--text', 'scene-label--dark-halo')
    expect(label).toHaveStyle({ color: '#9c27b0', fontSize: '13px' })
  })

  it('puts a badge letter in white on a chip of the given colour', () => {
    render(
      <SceneLabel position={[0, 0, 0]} variant="badge" color="#e11d48">
        N
      </SceneLabel>,
    )
    const badge = screen.getByText('N')
    expect(badge).toHaveClass('scene-label--badge')
    expect(badge.style.background).toBe('rgb(225, 29, 72)')
    expect(badge.style.color).toBe('')
  })
})
