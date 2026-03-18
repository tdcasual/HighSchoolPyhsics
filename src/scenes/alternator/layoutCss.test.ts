import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('alternator theme CSS', () => {
  const css = readFileSync(resolve(__dirname, './alternator.css'), 'utf8')

  it('defines explicit day-mode colors for the right viewport overlays', () => {
    expect(css).toMatch(/\.app-shell\.theme-day \.alternator-viewport\s*\{[^}]*background:\s*#[0-9a-fA-F]{6}/)
    expect(css).toMatch(/\.app-shell\.theme-day \.alternator-emf-panel,\s*\n\.app-shell\.theme-day \.alternator-legend,\s*\n\.app-shell\.theme-day \.alternator-speed-panel\s*\{[^}]*background:\s*rgba\(/)
    expect(css).toMatch(/\.app-shell\.theme-day \.alternator-overlay-top h2\s*\{[^}]*color:\s*#[0-9a-fA-F]{6}/)
  })

  it('defines explicit night-mode colors for the right viewport overlays', () => {
    expect(css).toMatch(/\.app-shell\.theme-night \.alternator-viewport\s*\{[^}]*background:\s*#[0-9a-fA-F]{6}/)
    expect(css).toMatch(/\.app-shell\.theme-night \.alternator-emf-panel,\s*\n\.app-shell\.theme-night \.alternator-legend,\s*\n\.app-shell\.theme-night \.alternator-speed-panel\s*\{[^}]*background:\s*rgba\(/)
    expect(css).toMatch(/\.app-shell\.theme-night \.alternator-overlay-top h2\s*\{[^}]*color:\s*#[0-9a-fA-F]{6}/)
  })
})
