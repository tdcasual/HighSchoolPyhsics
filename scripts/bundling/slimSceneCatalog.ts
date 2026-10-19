import type { Plugin } from 'vite'

type CatalogEntry = Record<string, unknown> & { touchProfile?: unknown; playwright?: unknown }

/**
 * Removes what the browser never reads from config/demo-scenes.json in production builds:
 * Playwright metadata (only the scripts use it) and touch profiles identical to the app's default
 * (resolveTouchProfile falls back to it). The file and dev/test builds keep the full catalog.
 */
export function slimSceneCatalogEntries(entries: CatalogEntry[], defaultTouchProfile: unknown): CatalogEntry[] {
  const defaultJson = JSON.stringify(defaultTouchProfile)
  return entries.map((entry) => {
    const slim: CatalogEntry = { ...entry }
    delete slim.playwright
    if (JSON.stringify(slim.touchProfile) === defaultJson) delete slim.touchProfile
    return slim
  })
}

export function slimSceneCatalog(defaultTouchProfile: unknown): Plugin {
  return {
    name: 'slim-scene-catalog',
    apply: 'build',
    enforce: 'pre',
    transform(code, id) {
      if (!id.replaceAll('\\', '/').endsWith('/config/demo-scenes.json')) return null
      return { code: JSON.stringify(slimSceneCatalogEntries(JSON.parse(code), defaultTouchProfile)), map: null }
    },
  }
}
