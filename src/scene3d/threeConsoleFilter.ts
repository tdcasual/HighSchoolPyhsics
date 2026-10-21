import { getConsoleFunction, setConsoleFunction } from 'three'

export type ThreeConsoleFilterEnvironment = 'development' | 'test' | 'production'

/** Hidden everywhere: harmless with code-split chunks. */
const ALWAYS = ['WARNING: Multiple instances of Three.js being imported.']
/** Hidden while developing and testing (jsdom loses contexts; drei still uses THREE.Clock). */
const DEV_AND_TEST = [
  'THREE.WebGLRenderer: Context Lost.',
  'THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.',
]

let installed = false

function currentEnvironment(requested?: unknown): ThreeConsoleFilterEnvironment {
  const candidates = [requested, import.meta.env?.MODE, typeof process !== 'undefined' ? process.env.NODE_ENV : undefined]
  const match = candidates.find((value) => value === 'development' || value === 'test' || value === 'production')
  return (match as ThreeConsoleFilterEnvironment | undefined) ?? 'development'
}

/** Routes three.js console output through a filter that drops known, harmless messages. */
export function installThreeConsoleFilter(options: { environment?: ThreeConsoleFilterEnvironment } = {}): void {
  if (installed) return
  installed = true
  const environment = currentEnvironment(options.environment)
  const suppressed = environment === 'production' ? ALWAYS : [...ALWAYS, ...DEV_AND_TEST]
  const originalConsole = getConsoleFunction()

  setConsoleFunction((type, message, ...params) => {
    const text = typeof message === 'string' ? message : String(message)
    if (suppressed.some((pattern) => text.includes(pattern))) return
    if (typeof originalConsole === 'function') {
      originalConsole(type, text, ...params)
      return
    }
    const method = (['warn', 'error', 'info', 'debug'] as const).find((name) => name === type.toLowerCase()) ?? 'log'
    console[method](text, ...params)
  })
}
