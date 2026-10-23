type CompiledVoltageExpression = {
  source: string
  error: string | null
  evaluate: (timeS: number) => number
}

type Token =
  | { kind: 'number'; value: number; text: string }
  | { kind: 'identifier'; value: string }
  | { kind: 'operator'; value: '+' | '-' | '*' | '/' | '^' }
  | { kind: 'leftParen' }
  | { kind: 'rightParen' }
  | { kind: 'comma' }

type ExpressionNode =
  | { type: 'number'; value: number }
  | { type: 'time' }
  | { type: 'unary'; operator: '+' | '-'; operand: ExpressionNode }
  | {
      type: 'binary'
      operator: '+' | '-' | '*' | '/' | '^'
      left: ExpressionNode
      right: ExpressionNode
    }
  | { type: 'call'; name: string; args: ExpressionNode[] }

type FormulaFunction = (args: number[]) => number

const MAX_SOURCE_LENGTH = 512
const MAX_TOKEN_COUNT = 256
const MAX_PARSE_DEPTH = 64

const FORMULA_FUNCTIONS: Record<string, FormulaFunction> = {
  sin: (args) => Math.sin(args[0] ?? 0),
  cos: (args) => Math.cos(args[0] ?? 0),
  tan: (args) => Math.tan(args[0] ?? 0),
  asin: (args) => Math.asin(args[0] ?? 0),
  acos: (args) => Math.acos(args[0] ?? 0),
  atan: (args) => Math.atan(args[0] ?? 0),
  abs: (args) => Math.abs(args[0] ?? 0),
  sqrt: (args) => Math.sqrt(args[0] ?? 0),
  log: (args) => Math.log(args[0] ?? 0),
  exp: (args) => Math.exp(args[0] ?? 0),
  floor: (args) => Math.floor(args[0] ?? 0),
  ceil: (args) => Math.ceil(args[0] ?? 0),
  round: (args) => Math.round(args[0] ?? 0),
  min: (args) => Math.min(...args),
  max: (args) => Math.max(...args),
  clamp: (args) => Math.min(args[2] ?? 0, Math.max(args[1] ?? 0, args[0] ?? 0)),
  square: (args) => (Math.sin(args[0] ?? 0) >= 0 ? 1 : -1),
  triangle: (args) => (2 / Math.PI) * Math.asin(Math.sin(args[0] ?? 0)),
  sawtooth: (args) => {
    const phase = args[0] ?? 0
    const cycle = phase / (2 * Math.PI)
    return 2 * (cycle - Math.floor(cycle + 0.5))
  },
}

const FUNCTION_ARITY: Record<string, { min: number; max: number }> = {
  sin: { min: 1, max: 1 },
  cos: { min: 1, max: 1 },
  tan: { min: 1, max: 1 },
  asin: { min: 1, max: 1 },
  acos: { min: 1, max: 1 },
  atan: { min: 1, max: 1 },
  abs: { min: 1, max: 1 },
  sqrt: { min: 1, max: 1 },
  log: { min: 1, max: 1 },
  exp: { min: 1, max: 1 },
  floor: { min: 1, max: 1 },
  ceil: { min: 1, max: 1 },
  round: { min: 1, max: 1 },
  min: { min: 1, max: Number.POSITIVE_INFINITY },
  max: { min: 1, max: Number.POSITIVE_INFINITY },
  clamp: { min: 3, max: 3 },
  square: { min: 1, max: 1 },
  triangle: { min: 1, max: 1 },
  sawtooth: { min: 1, max: 1 },
}

class FormulaParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FormulaParseError'
  }
}

function normalizeSource(source: string): string {
  const trimmed = source.trim()
  return trimmed.length === 0 ? '0' : trimmed.replaceAll('π', 'pi')
}

function tokenize(source: string): Token[] {
  if (source.length > MAX_SOURCE_LENGTH) {
    throw new FormulaParseError('公式过长，请控制在 ' + MAX_SOURCE_LENGTH + ' 个字符以内')
  }

  const tokens: Token[] = []
  let index = 0

  while (index < source.length) {
    const char = source[index] ?? ''
    if (/\s/.test(char)) {
      index += 1
      continue
    }

    if (char === '.' && !/[0-9]/.test(source[index + 1] ?? '')) {
      throw new FormulaParseError('公式含有非法字符: .')
    }

    if (/[0-9.]/.test(char)) {
      const matched = source.slice(index).match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/)
      if (!matched) {
        throw new FormulaParseError('公式语法错误：位置 ' + (index + 1) + ' 的数字格式无效')
      }
      const value = Number(matched[0])
      if (!Number.isFinite(value)) {
        throw new FormulaParseError('公式语法错误：位置 ' + (index + 1) + ' 的数值超出范围')
      }
      tokens.push({ kind: 'number', value, text: matched[0] })
      index += matched[0].length
    } else if (/[A-Za-z_]/.test(char)) {
      const matched = source.slice(index).match(/^[A-Za-z_][A-Za-z0-9_]*/)
      if (!matched) {
        throw new FormulaParseError('公式语法错误：位置 ' + (index + 1) + ' 的名称无效')
      }
      tokens.push({ kind: 'identifier', value: matched[0].toLowerCase() })
      index += matched[0].length
    } else if (char === '+' || char === '-' || char === '*' || char === '/' || char === '^') {
      tokens.push({ kind: 'operator', value: char })
      index += 1
    } else if (char === '(') {
      tokens.push({ kind: 'leftParen' })
      index += 1
    } else if (char === ')') {
      tokens.push({ kind: 'rightParen' })
      index += 1
    } else if (char === ',') {
      tokens.push({ kind: 'comma' })
      index += 1
    } else {
      throw new FormulaParseError('公式含有非法字符: ' + char)
    }

    if (tokens.length > MAX_TOKEN_COUNT) {
      throw new FormulaParseError('公式过长，请减少运算符或函数参数（最多 ' + MAX_TOKEN_COUNT + ' 项）')
    }
  }

  return tokens
}

class FormulaParser {
  private position = 0
  private depth = 0
  private readonly tokens: Token[]

  constructor(tokens: Token[]) {
    this.tokens = tokens
  }

  parse(): ExpressionNode {
    if (this.tokens.length === 0) {
      return { type: 'number', value: 0 }
    }

    const expression = this.parseAdditive()
    if (this.position < this.tokens.length) {
      throw new FormulaParseError('公式语法错误：表达式后有多余内容')
    }
    return expression
  }

  private current(): Token | undefined {
    return this.tokens[this.position]
  }

  private consume(): Token {
    const token = this.current()
    if (!token) {
      throw new FormulaParseError('公式语法错误：表达式不完整')
    }
    this.position += 1
    return token
  }

  private enterNested<T>(parse: () => T): T {
    this.depth += 1
    if (this.depth > MAX_PARSE_DEPTH) {
      this.depth -= 1
      throw new FormulaParseError('公式嵌套层级过深（最多 ' + MAX_PARSE_DEPTH + ' 层）')
    }
    try {
      return parse()
    } finally {
      this.depth -= 1
    }
  }

  private parseAdditive(): ExpressionNode {
    let expression = this.parseMultiplicative()
    while (this.current()?.kind === 'operator') {
      const operator = this.current()
      if (operator?.kind !== 'operator' || (operator.value !== '+' && operator.value !== '-')) break
      this.consume()
      expression = {
        type: 'binary',
        operator: operator.value,
        left: expression,
        right: this.parseMultiplicative(),
      }
    }
    return expression
  }

  private parseMultiplicative(): ExpressionNode {
    let expression = this.parseUnary()
    while (this.current()?.kind === 'operator') {
      const operator = this.current()
      if (operator?.kind !== 'operator' || (operator.value !== '*' && operator.value !== '/')) break
      this.consume()
      expression = {
        type: 'binary',
        operator: operator.value,
        left: expression,
        right: this.parseUnary(),
      }
    }
    return expression
  }

  private parseUnary(): ExpressionNode {
    const token = this.current()
    if (token?.kind === 'operator' && (token.value === '+' || token.value === '-')) {
      this.consume()
      const operator = token.value
      return this.enterNested(() => ({
        type: 'unary',
        operator,
        operand: this.parseUnary(),
      }))
    }
    return this.parsePower()
  }

  private parsePower(): ExpressionNode {
    const left = this.parsePrimary()
    const operator = this.current()
    if (operator?.kind === 'operator' && operator.value === '^') {
      this.consume()
      return this.enterNested(() => ({
        type: 'binary',
        operator: '^',
        left,
        right: this.parseUnary(),
      }))
    }
    return left
  }

  private parsePrimary(): ExpressionNode {
    const token = this.consume()

    if (token.kind === 'number') {
      return { type: 'number', value: token.value }
    }

    if (token.kind === 'leftParen') {
      return this.enterNested(() => {
        const expression = this.parseAdditive()
        if (this.current()?.kind !== 'rightParen') {
          throw new FormulaParseError('公式语法错误：缺少右括号')
        }
        this.consume()
        return expression
      })
    }

    if (token.kind === 'identifier') {
      if (this.current()?.kind === 'leftParen') {
        const functionName = token.value
        if (!Object.prototype.hasOwnProperty.call(FORMULA_FUNCTIONS, functionName)) {
          throw new FormulaParseError('公式含有不支持的函数: ' + functionName)
        }

        this.consume()
        const args: ExpressionNode[] = []
        if (this.current()?.kind !== 'rightParen') {
          args.push(this.enterNested(() => this.parseAdditive()))
          while (this.current()?.kind === 'comma') {
            this.consume()
            args.push(this.enterNested(() => this.parseAdditive()))
          }
        }
        if (this.current()?.kind !== 'rightParen') {
          throw new FormulaParseError('公式语法错误：函数参数缺少右括号')
        }
        this.consume()

        const arity = FUNCTION_ARITY[functionName]
        if (!arity || args.length < arity.min || args.length > arity.max) {
          throw new FormulaParseError('函数 ' + functionName + ' 的参数数量不正确')
        }
        return { type: 'call', name: functionName, args }
      }

      if (token.value === 't') return { type: 'time' }
      if (token.value === 'pi') return { type: 'number', value: Math.PI }
      if (token.value === 'e') return { type: 'number', value: Math.E }
      throw new FormulaParseError('公式含有不支持的标识符: ' + token.value)
    }

    throw new FormulaParseError('公式语法错误：此处需要数字、变量、函数或括号')
  }
}

function evaluateNode(node: ExpressionNode, timeS: number): number {
  switch (node.type) {
    case 'number':
      return node.value
    case 'time':
      return timeS
    case 'unary': {
      const value = evaluateNode(node.operand, timeS)
      return node.operator === '-' ? -value : value
    }
    case 'binary': {
      const left = evaluateNode(node.left, timeS)
      const right = evaluateNode(node.right, timeS)
      switch (node.operator) {
        case '+':
          return left + right
        case '-':
          return left - right
        case '*':
          return left * right
        case '/':
          return left / right
        case '^':
          return left ** right
      }
      return 0
    }
    case 'call':
      return FORMULA_FUNCTIONS[node.name]?.(node.args.map((argument) => evaluateNode(argument, timeS))) ?? 0
  }
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

  try {
    const expression = new FormulaParser(tokenize(normalizedSource)).parse()
    return {
      source: normalizedSource,
      error: null,
      evaluate: (timeS: number) => {
        const value = evaluateNode(expression, timeS)
        return Number.isFinite(value) ? value : 0
      },
    }
  } catch (error) {
    const message = error instanceof FormulaParseError ? error.message : '公式解析失败，请检查输入'
    return fallback(normalizedSource, message)
  }
}
