import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('motional-emf viewport css', () => {
  const css = readFileSync(resolve(__dirname, './motional-emf.css'), 'utf8')

  it('keeps the viewport stack full-height so the canvas can fill the panel', () => {
    expect(css).toMatch(/\.motional-emf-viewport-stack\s*\{[^}]*height:\s*100%/)
    expect(css).toMatch(/\.motional-emf-viewport-stack\s*\{[^}]*position:\s*relative/)
  })

  it('positions the scene title as an overlay instead of consuming canvas height', () => {
    expect(css).toMatch(/\.motional-emf-scene-title\s*\{[^}]*position:\s*absolute/)
    expect(css).toMatch(/\.motional-emf-scene-title\s*\{[^}]*pointer-events:\s*none/)
  })
})
