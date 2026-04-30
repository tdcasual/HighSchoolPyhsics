import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SidebarPanel } from '../SidebarPanel'

describe('SidebarPanel', () => {
  it('renders children when expanded', () => {
    render(<SidebarPanel>sidebar body</SidebarPanel>)
    expect(screen.getByText('sidebar body')).toBeInTheDocument()
  })

  it('hides children when collapsed', () => {
    render(<SidebarPanel defaultCollapsed>sidebar body</SidebarPanel>)
    expect(screen.queryByText('sidebar body')).not.toBeInTheDocument()
  })

  it('shows expand button when collapsed', () => {
    render(<SidebarPanel defaultCollapsed>body</SidebarPanel>)
    expect(screen.getByRole('button', { name: /展开/i })).toBeInTheDocument()
  })

  it('shows collapse button when expanded', () => {
    render(<SidebarPanel title="参数">body</SidebarPanel>)
    expect(screen.getByRole('button', { name: /折叠/i })).toBeInTheDocument()
  })

  it('toggles between collapsed and expanded', () => {
    render(<SidebarPanel>sidebar body</SidebarPanel>)
    const btn = screen.getByRole('button', { name: /折叠/i })
    fireEvent.click(btn)
    expect(screen.queryByText('sidebar body')).not.toBeInTheDocument()
    const expandBtn = screen.getByRole('button', { name: /展开/i })
    fireEvent.click(expandBtn)
    expect(screen.getByText('sidebar body')).toBeInTheDocument()
  })

  it('renders title when provided', () => {
    render(<SidebarPanel title="参数控制">body</SidebarPanel>)
    expect(screen.getByText('参数控制')).toBeInTheDocument()
  })
})
