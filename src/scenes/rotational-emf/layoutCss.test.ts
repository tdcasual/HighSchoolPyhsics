import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('rotational-emf css layout', () => {
  const css = readFileSync(resolve(process.cwd(), 'src/scenes/rotational-emf/rotational-emf.css'), 'utf8')

  it('keeps the viewport stack at full height so the canvas does not collapse into a top strip', () => {
    expect(css).toContain('.rotational-emf-viewport-stack')
    expect(css).toMatch(/\.rotational-emf-viewport-stack\s*\{[^}]*height:\s*100%/s)
    expect(css).toMatch(/\.rotational-emf-viewport-stack\s*\{[^}]*position:\s*relative/s)
  })
})
