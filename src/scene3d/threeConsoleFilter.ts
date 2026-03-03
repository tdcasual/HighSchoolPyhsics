import { getConsoleFunction, setConsoleFunction } from 'three'

let installed = false
let activeEnvironment: ThreeConsoleFilterEnvironment = 'development'
let activeSuppressedPatterns: readonly string[] = []
const suppressedCounts = new Map<string, number>()

type ConsoleMethodName = 'warn' | 'error' | 'log' | 'info' | 'debug'
export type ThreeConsoleFilterEnvironment = 'development' | 'test' | 'production'
type ThreeConsoleFilterPolicy = Record<ThreeConsoleFilterEnvironment, readonly string[]>

const ALWAYS_SUPPRESSED_THREE_MESSAGES = [
  'WARNING: Multiple instances of Three.js being imported.',
] as const

const DEVELOPMENT_AND_TEST_SUPPRESSED_THREE_MESSAGES = [
  'THREE.WebGLRenderer: Context Lost.',
] as const

const TEST_ONLY_SUPPRESSED_THREE_MESSAGES = [
  'THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.',
] as const

const SUPPRESSED_THREE_MESSAGE_POLICY: ThreeConsoleFilterPolicy = {
  development: [...ALWAYS_SUPPRESSED_THREE_MESSAGES, ...DEVELOPMENT_AND_TEST_SUPPRESSED_THREE_MESSAGES],
  test: [
    ...ALWAYS_SUPPRESSED_THREE_MESSAGES,
    ...DEVELOPMENT_AND_TEST_SUPPRESSED_THREE_MESSAGES,
    ...TEST_ONLY_SUPPRESSED_THREE_MESSAGES,
  ],
  production: [...ALWAYS_SUPPRESSED_THREE_MESSAGES],
}

function resolveFilterEnvironment(
  requestedEnvironment?: ThreeConsoleFilterEnvironment,
): ThreeConsoleFilterEnvironment {
  if (requestedEnvironment) {
    return requestedEnvironment
  }

  if (typeof import.meta !== 'undefined' && import.meta.env?.MODE) {
    const viteMode = import.meta.env.MODE
    if (viteMode === 'test' || viteMode === 'development' || viteMode === 'production') {
      return viteMode
    }
  }

  if (typeof process !== 'undefined') {
    const nodeEnvironment = process.env.NODE_ENV
    if (nodeEnvironment === 'test' || nodeEnvironment === 'development' || nodeEnvironment === 'production') {
      return nodeEnvironment
    }
  }

  return 'development'
}

function resolveSuppressedPatterns(environment: ThreeConsoleFilterEnvironment): readonly string[] {
  return SUPPRESSED_THREE_MESSAGE_POLICY[environment]
}

function findSuppressedPattern(messageText: string): string | null {
  return activeSuppressedPatterns.find((pattern) => messageText.includes(pattern)) ?? null
}

function trackSuppressedPattern(pattern: string): void {
  const currentCount = suppressedCounts.get(pattern) ?? 0
  suppressedCounts.set(pattern, currentCount + 1)
}

function resolveConsoleMethod(type: string): ConsoleMethodName {
  const method = type.toLowerCase()
  if (method === 'warn' || method === 'error' || method === 'info' || method === 'debug') {
    return method
  }
  return 'log'
}

export function getThreeConsoleFilterPolicy(): {
  environment: ThreeConsoleFilterEnvironment
  suppressedPatterns: string[]
} {
  return {
    environment: activeEnvironment,
    suppressedPatterns: [...activeSuppressedPatterns],
  }
}

export function getThreeConsoleFilterStats(): {
  environment: ThreeConsoleFilterEnvironment
  suppressedTotal: number
  suppressedByPattern: Record<string, number>
} {
  let suppressedTotal = 0
  const suppressedByPattern = Array.from(suppressedCounts.entries()).reduce<Record<string, number>>((acc, entry) => {
    const [pattern, count] = entry
    acc[pattern] = count
    suppressedTotal += count
    return acc
  }, {})

  return {
    environment: activeEnvironment,
    suppressedTotal,
    suppressedByPattern,
  }
}

export function installThreeConsoleFilter(options: { environment?: ThreeConsoleFilterEnvironment } = {}): void {
  if (installed) {
    return
  }
  installed = true
  activeEnvironment = resolveFilterEnvironment(options.environment)
  activeSuppressedPatterns = resolveSuppressedPatterns(activeEnvironment)
  suppressedCounts.clear()

  const originalConsole = getConsoleFunction()

  setConsoleFunction((type, message, ...params) => {
    const messageText = typeof message === 'string' ? message : String(message)
    const suppressedPattern = findSuppressedPattern(messageText)
    if (suppressedPattern) {
      trackSuppressedPattern(suppressedPattern)
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
