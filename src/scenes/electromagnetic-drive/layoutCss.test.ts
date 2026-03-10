import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('electromagnetic-drive board css', () => {
  const css = readFileSync(resolve(__dirname, './electromagnetic-drive.css'), 'utf8')

  it('uses a light board palette by default and preserves the dark board palette for night mode', () => {
    expect(css).toMatch(/\.electromagnetic-drive-board\s*\{[^}]*background:\s*linear-gradient\(180deg, rgba\(248, 250, 253, 0\.98\) 0%, rgba\(232, 238, 246, 0\.98\) 100%\)/)
    expect(css).toMatch(/\.electromagnetic-drive-board\s*\{[^}]*color:\s*#1f2e3c/)
    expect(css).toMatch(/\.app-shell\.theme-night \.electromagnetic-drive-board\s*\{[^}]*background:\s*linear-gradient\(180deg, rgba\(18, 25, 34, 0\.98\) 0%, rgba\(10, 16, 24, 0\.98\) 100%\)/)
    expect(css).toMatch(/\.app-shell\.theme-night \.electromagnetic-drive-board\s*\{[^}]*color:\s*#eef2f6/)
  })

  it('defines a light chart palette by default and overrides it for night mode', () => {
    expect(css).toMatch(/\.electromagnetic-drive-chart-card\s*\{[^}]*--electromagnetic-drive-chart-grid-line:\s*rgba\(115, 134, 156, 0\.18\)/)
    expect(css).toMatch(/\.electromagnetic-drive-chart-card\s*\{[^}]*--electromagnetic-drive-chart-axis-line:\s*rgba\(93, 115, 138, 0\.38\)/)
    expect(css).toMatch(/\.electromagnetic-drive-chart-card\s*\{[^}]*--electromagnetic-drive-chart-magnet-line:\s*#d94c57/)
    expect(css).toMatch(/\.electromagnetic-drive-chart-card\s*\{[^}]*--electromagnetic-drive-chart-frame-line:\s*#2f8fcb/)
    expect(css).toMatch(/\.electromagnetic-drive-chart\s*\{[^}]*background:\s*var\(--electromagnetic-drive-chart-surface\)/)
    expect(css).toMatch(/\.app-shell\.theme-night \.electromagnetic-drive-chart-card\s*\{[^}]*--electromagnetic-drive-chart-grid-line:\s*rgba\(255, 255, 255, 0\.12\)/)
    expect(css).toMatch(/\.app-shell\.theme-night \.electromagnetic-drive-chart-card\s*\{[^}]*--electromagnetic-drive-chart-frame-line:\s*#33ddee/)
  })
})
