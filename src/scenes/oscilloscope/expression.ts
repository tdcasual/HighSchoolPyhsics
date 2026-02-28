type CompiledVoltageExpression = {
  source: string
  error: string | null
  evaluate: (timeS: number) => number
}

type HelperLibrary = {
  clamp: (value: number, min: number, max: number) => number
  square: (phase: number) => number
  triangle: (phase: number) => number
  sawtooth: (phase: number) => number
}

const IDENTIFIER_PATTERN = /[A-Za-z_][A-Za-z0-9_]*/g
const ILLEGAL_CHAR_PATTERN = /[^0-9+\-*/^().,\sA-Za-z_π]/

const JS_IDENTIFIER_MAP: Record<string, string> = {
  t: 't',
  pi: 'Math.PI',
  e: 'Math.E',
  sin: 'Math.sin',
  cos: 'Math.cos',
  tan: 'Math.tan',
  asin: 'Math.asin',
  acos: 'Math.acos',
  atan: 'Math.atan',
  abs: 'Math.abs',
  sqrt: 'Math.sqrt',
  log: 'Math.log',
  exp: 'Math.exp',
  floor: 'Math.floor',
  ceil: 'Math.ceil',
  round: 'Math.round',
  min: 'Math.min',
  max: 'Math.max',
  clamp: 'helpers.clamp',
  square: 'helpers.square',
  triangle: 'helpers.triangle',
  sawtooth: 'helpers.sawtooth',
}

const helpers: HelperLibrary = {
  clamp: (value, min, max) => Math.min(max, Math.max(min, value)),
  square: (phase) => (Math.sin(phase) >= 0 ? 1 : -1),
  triangle: (phase) => (2 / Math.PI) * Math.asin(Math.sin(phase)),
  sawtooth: (phase) => {
    const cycle = phase / (2 * Math.PI)
    return 2 * (cycle - Math.floor(cycle + 0.5))
  },
}

function normalizeSource(source: string): string {
  const trimmed = source.trim()
  if (trimmed.length === 0) {
    return '0'
  }
  return trimmed.replaceAll('π', 'pi')
}

function isScientificExponentIdentifier(source: string, startIndex: number, identifier: string): boolean {
  if (!identifier.toLowerCase().startsWith('e')) {
    return false
  }

  const previousChar = source[startIndex - 1] ?? ''
  if (!/[0-9.]/.test(previousChar)) {
    return false
  }

  if (/^[eE]\d+$/.test(identifier)) {
    return true
  }

  if (!/^[eE]$/.test(identifier)) {
    return false
  }

  const sign = source[startIndex + 1] ?? ''
  const digit =
    sign === '+' || sign === '-'
      ? source[startIndex + 2] ?? ''
      : sign

  return /\d/.test(digit)
}

function collectIdentifierTokens(source: string): string[] {
  const identifiers: string[] = []

  for (const match of source.matchAll(IDENTIFIER_PATTERN)) {
    const identifier = match[0]
    const startIndex = match.index ?? 0
    if (isScientificExponentIdentifier(source, startIndex, identifier)) {
      continue
    }
    identifiers.push(identifier)
  }

  return identifiers
}

function toJavaScriptSource(source: string): { code: string; error: string | null } {
  if (ILLEGAL_CHAR_PATTERN.test(source)) {
    return {
      code: '0',
      error: '公式含有非法字符，仅支持数字、t、基础运算和函数名',
    }
  }

  const identifiers = collectIdentifierTokens(source)
  for (const identifier of identifiers) {
    const token = identifier.toLowerCase()
    if (!Object.prototype.hasOwnProperty.call(JS_IDENTIFIER_MAP, token)) {
      return {
        code: '0',
        error: `公式含有不支持的标识符: ${identifier}`,
      }
    }
  }

  const replaced = source
    .replace(IDENTIFIER_PATTERN, (identifier, offset, fullSource) => {
      if (isScientificExponentIdentifier(fullSource, offset, identifier)) {
        return identifier
      }
      return JS_IDENTIFIER_MAP[identifier.toLowerCase()] ?? identifier
    })
    .replaceAll('^', '**')

  return { code: replaced, error: null }
}

function fallback(source: string, error: string): CompiledVoltageExpression {
  return {
    source,
    error,
    evaluate: () => 0,
  }
}

export function compileVoltageExpression(source: string): CompiledVoltageExpression {
  const normalizedSource = normalizeSource(source)
  const { code, error } = toJavaScriptSource(normalizedSource)

  if (error) {
    return fallback(normalizedSource, error)
  }

  try {
    const evaluator = new Function(
      't',
      'helpers',
      `"use strict"; return (${code});`,
    ) as (timeS: number, helperLibrary: HelperLibrary) => unknown

    return {
      source: normalizedSource,
      error: null,
      evaluate: (timeS: number) => {
        const value = Number(evaluator(timeS, helpers))
        if (!Number.isFinite(value)) {
          return 0
        }
        return value
      },
    }
  } catch {
    return fallback(normalizedSource, '公式语法错误，请检查括号与运算符')
  }
}
