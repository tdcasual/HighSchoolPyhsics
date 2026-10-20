#!/usr/bin/env node
// Prints how far each scene has moved onto the shared architecture, as a Markdown table.
//   npm run report:architecture            (table + totals)
//   npm run report:architecture -- --json  (machine-readable)
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

const ROOT_DIR = process.cwd()
const SCENES_DIR = path.join(ROOT_DIR, 'src/scenes')

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}

const isSource = (file) => /\.(ts|tsx)$/.test(file) && !file.includes('__tests__') && !/\.test\.tsx?$/.test(file)
const isTest = (file) => file.includes('__tests__') || /\.test\.tsx?$/.test(file)

/** Each check answers "does this scene use the shared piece?" from its source text. */
const CHECKS = {
  clock: (text) => /useSimulationClock|useAnimatedState|useAnimationLoop/.test(text),
  playback: (text) => /clockActions\(/.test(text),
  charts: (text, files) => !files.some((file) => /Chart\.tsx$/.test(file)) || /ui\/charts\//.test(text),
  framing: (text) => /<FittedCanvas\b|useFittedOrbitCamera|useBoundsFraming/.test(text) && !/camera=\{\{\s*position/.test(text),
  layered: (_text, files) => ['SceneState.ts', 'Controls.tsx', 'Scene.tsx'].every((suffix) => files.some((file) => path.basename(file).endsWith(suffix))),
  dataRows: (text) => /<DataRows/.test(text),
}

export function collectSceneReport(scenesDir = SCENES_DIR) {
  return readdirSync(scenesDir)
    .filter((entry) => entry !== '__tests__' && statSync(path.join(scenesDir, entry)).isDirectory())
    .sort()
    .map((scene) => {
      const files = walk(path.join(scenesDir, scene))
      const sources = files.filter(isSource)
      const text = sources.map((file) => readFileSync(file, 'utf8')).join('\n')
      const lines = text.split('\n').length
      const checks = Object.fromEntries(Object.entries(CHECKS).map(([name, check]) => [name, check(text, sources)]))
      return { scene, lines, tests: files.filter(isTest).length, ...checks }
    })
}

function toMarkdown(rows) {
  const names = Object.keys(CHECKS)
  const header = `| 场景 | 行数 | 测试 | ${names.join(' | ')} |\n|---|---:|---:|${names.map(() => ':-:').join('|')}|`
  const body = rows.map((row) => `| ${row.scene} | ${row.lines} | ${row.tests} | ${names.map((name) => (row[name] ? '✔' : '·')).join(' | ')} |`)
  const totals = `| **合计 ${rows.length}** | ${rows.reduce((sum, row) => sum + row.lines, 0)} | ${rows.reduce((sum, row) => sum + row.tests, 0)} | ${names.map((name) => `${rows.filter((row) => row[name]).length}/${rows.length}`).join(' | ')} |`
  return [header, ...body, totals].join('\n')
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const rows = collectSceneReport()
  console.log(process.argv.includes('--json') ? JSON.stringify(rows, null, 2) : toMarkdown(rows))
}
