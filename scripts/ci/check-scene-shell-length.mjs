#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

const ROOT_DIR = process.cwd()
const SCENES_DIR = path.resolve(ROOT_DIR, 'src/scenes')
const DEFAULT_MAX_LINES = 240

function parsePositiveInteger(rawValue, fallback) {
  if (!rawValue) {
    return fallback
  }

  const parsed = Number.parseInt(rawValue, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid positive integer: ${rawValue}`)
  }
  return parsed
}

const MAX_SCENE_SHELL_LINES = parsePositiveInteger(
  process.env.MAX_SCENE_SHELL_LINES,
  DEFAULT_MAX_LINES,
)

function walkFiles(dirPath) {
  const entries = readdirSync(dirPath)
  const files = []

  for (const entry of entries) {
    const resolvedPath = path.join(dirPath, entry)
    const stats = statSync(resolvedPath)
    if (stats.isDirectory()) {
      files.push(...walkFiles(resolvedPath))
      continue
    }
    files.push(resolvedPath)
  }

  return files
}

function countLines(fileContent) {
  if (fileContent.length === 0) {
    return 0
  }
  return fileContent.split(/\r?\n/).length
}

function toPosixPath(filePath) {
  return filePath.split(path.sep).join('/')
}

const sceneShellFiles = walkFiles(SCENES_DIR)
  .map((absolutePath) => path.relative(ROOT_DIR, absolutePath))
  .map(toPosixPath)
  .filter(
    (relativePath) =>
      relativePath.endsWith('Scene.tsx') &&
      !relativePath.includes('/__tests__/'),
  )
  .sort((a, b) => a.localeCompare(b))

if (sceneShellFiles.length === 0) {
  throw new Error('No scene shell files found (expected *Scene.tsx under src/scenes)')
}

const failures = []

for (const relativePath of sceneShellFiles) {
  const absolutePath = path.join(ROOT_DIR, relativePath)
  const lineCount = countLines(readFileSync(absolutePath, 'utf8'))
  const maxLines = MAX_SCENE_SHELL_LINES

  if (lineCount > maxLines) {
    failures.push(`${relativePath} = ${lineCount} lines (max ${maxLines})`)
    continue
  }

  console.log(`[ok] ${relativePath} = ${lineCount} lines (max ${maxLines})`)
}

if (failures.length > 0) {
  console.error('Scene shell line budget check failed:')
  for (const failure of failures) {
    console.error(`  - ${failure}`)
  }
  process.exitCode = 1
} else {
  console.log('Scene shell line budget check passed.')
}
