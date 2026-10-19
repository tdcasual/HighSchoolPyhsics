import { describe, expect, it } from 'vitest'
import { collectPrecacheUrls, renderServiceWorker } from './offlineCache'

describe('offline cache', () => {
  it('precaches the shell, every built file and the public folder, without source maps', () => {
    const urls = collectPrecacheUrls(
      ['index.html', 'assets/index-abc.js', 'assets/index-abc.js.map', 'assets/vendor-three-core-x.js'],
      ['screenshots/mhd.webp', 'vite.svg'],
      '/',
    )
    expect(urls).toEqual(['/', '/assets/index-abc.js', '/assets/vendor-three-core-x.js', '/index.html', '/screenshots/mhd.webp', '/vite.svg'])
  })

  it('renders a worker that versions its cache and serves the shell for offline navigation', () => {
    const source = renderServiceWorker('v123', ['/', '/index.html'], '/')
    expect(source).toContain('"hsp-offline-v123"')
    expect(source).toContain("request.mode === 'navigate'")
    expect(source).toContain('caches.match(SHELL, { ignoreVary: true })')
    expect(source).toContain('caches.match(request, { ignoreVary: true })')
    // The generated file must be valid JavaScript.
    expect(() => new Function(source)).not.toThrow()
  })
})
