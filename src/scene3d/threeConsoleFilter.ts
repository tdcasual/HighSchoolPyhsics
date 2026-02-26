import { getConsoleFunction, setConsoleFunction } from 'three'

const IGNORED_THREE_MESSAGES = [
  'THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.',
  'THREE.WebGLRenderer: Context Lost.',
  'WARNING: Multiple instances of Three.js being imported.',
]

let installed = false

export function installThreeConsoleFilter(): void {
  if (installed) {
    return
  }
  installed = true

  const originalConsole = getConsoleFunction()

  setConsoleFunction((type, message, ...params) => {
    if (IGNORED_THREE_MESSAGES.some((entry) => message.includes(entry))) {
      return
    }
    originalConsole(type, message, ...params)
  })
}
