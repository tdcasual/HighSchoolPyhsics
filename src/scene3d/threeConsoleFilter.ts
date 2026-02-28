import { getConsoleFunction, setConsoleFunction } from 'three'

const IGNORED_THREE_MESSAGES = [
  'THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.',
  'THREE.WebGLRenderer: Context Lost.',
  'WARNING: Multiple instances of Three.js being imported.',
]

let installed = false

type ConsoleMethodName = 'warn' | 'error' | 'log' | 'info' | 'debug'

function resolveConsoleMethod(type: string): ConsoleMethodName {
  const method = type.toLowerCase()
  if (method === 'warn' || method === 'error' || method === 'info' || method === 'debug') {
    return method
  }
  return 'log'
}

export function installThreeConsoleFilter(): void {
  if (installed) {
    return
  }
  installed = true

  const originalConsole = getConsoleFunction()

  setConsoleFunction((type, message, ...params) => {
    const messageText = typeof message === 'string' ? message : String(message)
    if (IGNORED_THREE_MESSAGES.some((entry) => messageText.includes(entry))) {
      return
    }
    if (typeof originalConsole === 'function') {
      originalConsole(type, messageText, ...params)
      return
    }

    const consoleMethod = resolveConsoleMethod(type)
    console[consoleMethod](messageText, ...params)
  })
}
