import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const htmlPath = resolve(process.cwd(), 'dist/index.html')
// The overview is plain HTML (cards with WebP thumbnails); Three.js and R3F are only needed once a
// scene opens, so the homepage must not preload them.
const blockedTokens = ['vendor-three-core', 'vendor-three-extras', 'vendor-r3f']

const html = await readFile(htmlPath, 'utf8')
const preloadHrefs = [...html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="([^"]+)"/g)].map(
  (match) => match[1],
)

const blockedHrefs = preloadHrefs.filter((href) => blockedTokens.some((token) => href.includes(token)))

if (blockedHrefs.length > 0) {
  console.error('Homepage preload contains blocked heavy chunks:')
  for (const href of blockedHrefs) {
    console.error(`- ${href}`)
  }
  process.exit(1)
}

console.log('Homepage preload check passed.')
if (preloadHrefs.length > 0) {
  console.log(`Current preloads: ${preloadHrefs.join(', ')}`)
}
