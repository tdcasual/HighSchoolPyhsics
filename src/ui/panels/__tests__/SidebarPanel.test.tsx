import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SidebarPanel } from '../SidebarPanel'

describe('SidebarPanel', () => {
  it('renders children when expanded', () => {
    render(<SidebarPanel collapsed={false} onCollapsedChange={() => {}}>sidebar body</SidebarPanel>)
    expect(screen.getByText('sidebar body')).toBeInTheDocument()
  })

  it('hides children when collapsed', () => {
    render(<SidebarPanel collapsed onCollapsedChange={() => {}}>sidebar body</SidebarPanel>)
    expect(screen.queryByText('sidebar body')).not.toBeInTheDocument()
  })

  it('shows expand button when collapsed', () => {
    render(<SidebarPanel collapsed onCollapsedChange={() => {}}>body</SidebarPanel>)
    expect(screen.getByRole('button', { name: /展开/i })).toBeInTheDocument()
  })

  it('shows collapse button when expanded', () => {
    render(<SidebarPanel title="参数" collapsed={false} onCollapsedChange={() => {}}>body</SidebarPanel>)
    expect(screen.getByRole('button', { name: /折叠/i })).toBeInTheDocument()
  })

  it('toggles between collapsed and expanded', () => {
    const onCollapsedChange = vi.fn()
    const { rerender } = render(
      <SidebarPanel collapsed={false} onCollapsedChange={onCollapsedChange}>sidebar body</SidebarPanel>,
    )
    const btn = screen.getByRole('button', { name: /折叠/i })
    fireEvent.click(btn)
    expect(onCollapsedChange).toHaveBeenCalledWith(true)

    rerender(
      <SidebarPanel collapsed onCollapsedChange={onCollapsedChange}>sidebar body</SidebarPanel>,
    )
    expect(screen.queryByText('sidebar body')).not.toBeInTheDocument()

    const expandBtn = screen.getByRole('button', { name: /展开/i })
    fireEvent.click(expandBtn)
    expect(onCollapsedChange).toHaveBeenCalledWith(false)

    rerender(
      <SidebarPanel collapsed={false} onCollapsedChange={onCollapsedChange}>sidebar body</SidebarPanel>,
    )
    expect(screen.getByText('sidebar body')).toBeInTheDocument()
  })

  it('renders title when provided', () => {
    render(<SidebarPanel title="参数控制" collapsed={false} onCollapsedChange={() => {}}>body</SidebarPanel>)
    expect(screen.getByText('参数控制')).toBeInTheDocument()
  })
})
