import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FloatingPanel } from '../FloatingPanel'

describe('FloatingPanel', () => {
  it('renders title', () => {
    render(<FloatingPanel title="数据面板" defaultPosition={{ x: 0, y: 0 }}>content</FloatingPanel>)
    expect(screen.getByText('数据面板')).toBeInTheDocument()
  })

  it('renders children when expanded', () => {
    render(<FloatingPanel title="Test" defaultPosition={{ x: 0, y: 0 }}>panel body</FloatingPanel>)
    expect(screen.getByText('panel body')).toBeInTheDocument()
  })

  it('hides children when collapsed', () => {
    render(
      <FloatingPanel title="Test" defaultPosition={{ x: 0, y: 0 }} defaultCollapsed>
        panel body
      </FloatingPanel>,
    )
    expect(screen.queryByText('panel body')).not.toBeInTheDocument()
  })

  it('shows collapse button', () => {
    render(<FloatingPanel title="Test" defaultPosition={{ x: 0, y: 0 }}>body</FloatingPanel>)
    expect(screen.getByRole('button', { name: /折叠/i })).toBeInTheDocument()
  })

  it('toggles collapse on button click', () => {
    render(<FloatingPanel title="Test" defaultPosition={{ x: 0, y: 0 }}>panel body</FloatingPanel>)
    const btn = screen.getByRole('button', { name: /折叠/i })
    fireEvent.click(btn)
    expect(screen.queryByText('panel body')).not.toBeInTheDocument()
  })

  it('shows close button when closable', () => {
    render(
      <FloatingPanel title="Test" defaultPosition={{ x: 0, y: 0 }} closable onClose={() => {}}>
        body
      </FloatingPanel>,
    )
    expect(screen.getByRole('button', { name: /关闭/i })).toBeInTheDocument()
  })

  it('does not show close button when not closable', () => {
    render(<FloatingPanel title="Test" defaultPosition={{ x: 0, y: 0 }}>body</FloatingPanel>)
    expect(screen.queryByRole('button', { name: /关闭/i })).not.toBeInTheDocument()
  })

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn()
    render(
      <FloatingPanel title="Test" defaultPosition={{ x: 0, y: 0 }} closable onClose={onClose}>
        body
      </FloatingPanel>,
    )
    fireEvent.click(screen.getByRole('button', { name: /关闭/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
