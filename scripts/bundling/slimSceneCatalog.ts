import { readFileSync } from 'node:fs'
import path from 'node:path'
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

const SHELL_QUERY = '?shell'
const SHELL_FIELDS = ['pageId', 'label', 'touchProfile'] as const

/** The fields the app shell needs to route and size touch targets; the overview cards stay out. */
export function sceneCatalogShellEntries(entries: CatalogEntry[]): CatalogEntry[] {
  return entries.map((entry) => {
    const shell: CatalogEntry = {}
    for (const field of SHELL_FIELDS) if (field in entry) shell[field] = entry[field]
    return shell
  })
}

/**
 * `config/demo-scenes.json?shell` resolves to the catalog reduced to SHELL_FIELDS (and slimmed
 * like the full file in builds). The entry chunk imports this; card text (summary, highlights,
 * tags) is imported in full only by the lazily loaded overview.
 */
export function sceneCatalogShell(defaultTouchProfile: unknown): Plugin {
  let isBuild = false
  return {
    name: 'scene-catalog-shell',
    enforce: 'pre',
    configResolved(config) {
      isBuild = config.command === 'build'
    },
    resolveId(source, importer) {
      if (!source.endsWith('demo-scenes.json' + SHELL_QUERY) || !importer) return null
      return path.resolve(path.dirname(importer), source.slice(0, -SHELL_QUERY.length)) + SHELL_QUERY
    },
    load(id) {
      if (!id.endsWith('demo-scenes.json' + SHELL_QUERY)) return null
      const file = id.slice(0, -SHELL_QUERY.length)
      this.addWatchFile(file)
      const shell = sceneCatalogShellEntries(JSON.parse(readFileSync(file, 'utf8')))
      // Returned as JSON text: Vite's JSON plugin turns it into a module like any .json import.
      return JSON.stringify(isBuild ? slimSceneCatalogEntries(shell, defaultTouchProfile) : shell)
    },
  }
}
