import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const htmlPath = resolve(process.cwd(), 'dist/index.html')
// The 3D map overview on the homepage uses Three.js / R3F for the terrain visualization.
// These chunks are preloaded in the background so the 3D map renders smoothly
// once the Suspense boundary resolves.
const blockedTokens = []

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
