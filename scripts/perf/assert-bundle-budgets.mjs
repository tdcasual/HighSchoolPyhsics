import { readdirSync, statSync } from 'node:fs'
import path from 'node:path'

const DIST_ASSETS_DIR = path.resolve(process.cwd(), 'dist/assets')

function parseBudgetFromEnv(name, fallbackKilobytes) {
  const raw = process.env[name]
  if (!raw) {
    return fallbackKilobytes * 1024
  }

  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid numeric budget for ${name}: ${raw}`)
  }

  return Math.round(parsed * 1024)
}

const BUDGETS = [
  {
    label: 'vendor-three-core',
    pattern: /^vendor-three-core-.*\.js$/,
    maxBytes: parseBudgetFromEnv('BUDGET_VENDOR_THREE_CORE_KB', 760),
  },
  {
    label: 'vendor-r3f',
    pattern: /^vendor-r3f-.*\.js$/,
    maxBytes: parseBudgetFromEnv('BUDGET_VENDOR_R3F_KB', 300),
  },
  {
    label: 'vendor-react',
    pattern: /^vendor-react-.*\.js$/,
    maxBytes: parseBudgetFromEnv('BUDGET_VENDOR_REACT_KB', 210),
  },
  {
    label: 'app-entry-js',
    pattern: /^index-.*\.js$/,
    maxBytes: parseBudgetFromEnv('BUDGET_APP_ENTRY_JS_KB', 30),
  },
  {
    label: 'app-entry-css',
    pattern: /^index-.*\.css$/,
    maxBytes: parseBudgetFromEnv('BUDGET_APP_ENTRY_CSS_KB', 60),
  },
]

const files = readdirSync(DIST_ASSETS_DIR)
const failures = []

for (const budget of BUDGETS) {
  const matchedFile = files.find((file) => budget.pattern.test(file))
  if (!matchedFile) {
    failures.push(`[missing] ${budget.label}: pattern ${budget.pattern}`)
    continue
  }

  const sizeBytes = statSync(path.join(DIST_ASSETS_DIR, matchedFile)).size
  const maxKilobytes = (budget.maxBytes / 1024).toFixed(1)
  const actualKilobytes = (sizeBytes / 1024).toFixed(1)
  if (sizeBytes > budget.maxBytes) {
    failures.push(
      `[over] ${budget.label}: ${matchedFile} = ${actualKilobytes} kB (max ${maxKilobytes} kB)`,
    )
    continue
  }

  console.log(`[ok] ${budget.label}: ${matchedFile} = ${actualKilobytes} kB (max ${maxKilobytes} kB)`)
}

if (failures.length > 0) {
  console.error('Bundle budget check failed:')
  for (const failure of failures) {
    console.error(`  - ${failure}`)
  }
  process.exitCode = 1
} else {
  console.log('Bundle budget check passed.')
}
