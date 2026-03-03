import { constants } from 'node:fs'
import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const VALID_TONES = new Set(['scope', 'cyclotron', 'mhd', 'oersted'])
const VALID_SIGNALS = new Set(['chart', 'live-metric', 'time-series', 'interactive-readout'])

function parseArgs(argv) {
  const args = new Map()
  for (let index = 0; index < argv.length; index += 1) {
    const raw = argv[index]
    if (!raw.startsWith('--')) {
      continue
    }

    const key = raw.slice(2)
    const next = argv[index + 1]
    if (!next || next.startsWith('--')) {
      args.set(key, 'true')
      continue
    }

    args.set(key, next)
    index += 1
  }
  return args
}

function ensure(value, message) {
  if (!value) {
    throw new Error(message)
  }
}

function toPascalCase(id) {
  return id
    .split('-')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join('')
}

async function ensurePathMissing(pathname, message) {
  try {
    await access(pathname, constants.F_OK)
    throw new Error(message)
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return
    }
    throw error
  }
}

function buildCoreSummaryLines(coreLines) {
  const templates = [
    "          <p>状态: {state.running ? '运行中' : '已暂停'}</p>",
    '          <p>核心量: {state.intensity.toFixed(1)}</p>',
    '          <p>观察结论: 待补充</p>',
    '          <p>对比点: 待补充</p>',
    '          <p>课堂提示: 待补充</p>',
  ]

  return templates.slice(0, coreLines).join('\n')
}

function buildSceneTemplate({
  id,
  sceneName,
  controlsName,
  rigName,
  stateHookName,
  signalsLiteral,
  coreSummaryLines,
}) {
  return `import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { ${controlsName} } from './${controlsName}'
import { ${rigName} } from './${rigName}'
import { ${stateHookName} } from './${stateHookName}'
import './${id}.css'

export function ${sceneName}() {
  const state = ${stateHookName}()

  return (
    <SceneLayout
      presentationSignals={${signalsLiteral}}
      coreSummary={
        <div className="scene-core-summary-stack">
${coreSummaryLines}
        </div>
      }
      controls={<${controlsName} state={state} />}
      viewport={
        <InteractiveCanvas
          camera={{ position: [0, 1.8, 5.2], fov: 42 }}
          frameloop={state.running ? 'always' : 'demand'}
        >
          <${rigName} running={state.running} intensity={state.intensity} />
        </InteractiveCanvas>
      }
    />
  )
}

export default ${sceneName}
`
}

function buildStateTemplate({ stateHookName, stateTypeName }) {
  return `import { useMemo, useState } from 'react'

const INITIAL_INTENSITY = 1

export type ${stateTypeName} = {
  running: boolean
  intensity: number
  readoutText: string
  setIntensity: (value: number) => void
  toggleRunning: () => void
  reset: () => void
}

export function ${stateHookName}(): ${stateTypeName} {
  const [running, setRunning] = useState(false)
  const [intensity, setIntensity] = useState(INITIAL_INTENSITY)

  const readoutText = useMemo(() => intensity.toFixed(1), [intensity])

  const reset = () => {
    setRunning(false)
    setIntensity(INITIAL_INTENSITY)
  }

  return {
    running,
    intensity,
    readoutText,
    setIntensity,
    toggleRunning: () => setRunning((value) => !value),
    reset,
  }
}
`
}

function buildRigTemplate({ rigName }) {
  return `type ${rigName}Props = {
  running: boolean
  intensity: number
}

export function ${rigName}({ running, intensity }: ${rigName}Props) {
  return (
    <group>
      <ambientLight intensity={0.82} />
      <directionalLight position={[3.6, 4.8, 2.8]} intensity={0.95} />
      <mesh>
        <sphereGeometry args={[0.8 + intensity * 0.03, 32, 24]} />
        <meshStandardMaterial
          color={running ? '#2f95d5' : '#8aa7bf'}
          roughness={0.35}
          metalness={0.2}
        />
      </mesh>
    </group>
  )
}
`
}

function buildControlsTemplate({ id, label, controlsName, signalString, stateTypeName, stateHookName }) {
  return `import { RangeField } from '../../ui/controls/RangeField'
import { SceneActions } from '../../ui/controls/SceneActions'
import type { ${stateTypeName} } from './${stateHookName}'

type ${controlsName}Props = {
  state: ${stateTypeName}
}

export function ${controlsName}({ state }: ${controlsName}Props) {
  return (
    <>
      <h2>${label}控制</h2>

      <RangeField
        id="${id}-intensity"
        label="核心量"
        min={0}
        max={10}
        step={0.1}
        value={state.intensity}
        onChange={state.setIntensity}
      />

      <SceneActions
        actions={[
          {
            key: 'toggle-running',
            label: state.running ? '暂停' : '播放',
            onClick: state.toggleRunning,
          },
          {
            key: 'reset',
            label: '重置',
            onClick: state.reset,
          },
        ]}
      />

      <div className="${id}-readout" data-presentation-signal="${signalString}">
        <p>当前读数: {state.readoutText}</p>
      </div>

      <div className="structure-card">
        <h3>演示要点</h3>
        <ul>
          <li>先暂停讲结构，再播放讲动态。</li>
          <li>建议只改一个参数做对比观察。</li>
        </ul>
      </div>
    </>
  )
}
`
}

function buildCssTemplate(id) {
  return `.${id}-readout {
  padding: 0.56rem 0.64rem;
  border-radius: 10px;
  border: 1px solid #b4d0e8;
  background: rgba(231, 247, 255, 0.78);
}

.${id}-readout p {
  margin: 0;
  color: #1e4f72;
  font-family: 'SF Mono', Menlo, monospace;
}
`
}

function buildTestTemplate({ id, sceneName, label }) {
  return `import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ${sceneName} } from './${sceneName}'

describe('${id} structure', () => {
  it('renders classroom control title and readout block', async () => {
    render(<${sceneName} />)

    expect(await screen.findByText('${label}控制')).toBeInTheDocument()
    expect(await screen.findByText(/当前读数:/)).toBeInTheDocument()
  })
})
`
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const id = args.get('id')
  const label = args.get('label')
  const tone = args.get('tone') ?? 'scope'
  const tag = args.get('tag') ?? '课堂演示'
  const summary = args.get('summary') ?? `${label ?? '新演示'}场景`
  const highlightA = args.get('highlight-a') ?? '核心现象可视化'
  const highlightB = args.get('highlight-b') ?? '参数联动观察'
  const coreLinesRaw = args.get('core-lines') ?? '3'
  const signalsRaw = args.get('signals') ?? 'live-metric'

  ensure(id, 'Missing --id (example: --id hall-effect)')
  ensure(label, 'Missing --label (example: --label 霍尔效应)')
  ensure(/^[a-z][a-z0-9-]*$/.test(id), '--id must match ^[a-z][a-z0-9-]*$')
  ensure(VALID_TONES.has(tone), `--tone must be one of: ${[...VALID_TONES].join(', ')}`)

  const coreLines = Number.parseInt(coreLinesRaw, 10)
  ensure(Number.isInteger(coreLines), '--core-lines must be an integer')
  ensure(coreLines >= 3 && coreLines <= 5, '--core-lines must be in [3, 5]')

  const signals = signalsRaw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  ensure(signals.length > 0, '--signals must include at least one presentation signal')
  for (const signal of signals) {
    ensure(
      VALID_SIGNALS.has(signal),
      `Invalid signal "${signal}". Allowed: ${[...VALID_SIGNALS].join(', ')}`,
    )
  }

  const sceneNameBase = toPascalCase(id)
  ensure(sceneNameBase.length > 0, 'Unable to derive scene name from --id')

  const sceneName = `${sceneNameBase}Scene`
  const controlsName = `${sceneNameBase}Controls`
  const rigName = `${sceneNameBase}Rig3D`
  const stateHookName = `use${sceneNameBase}SceneState`
  const stateTypeName = `${sceneNameBase}SceneState`
  const signalsLiteral = `[${signals.map((signal) => `'${signal}'`).join(', ')}]`
  const signalString = signals.join(' ')

  const rootDir = process.cwd()
  const sceneDir = resolve(rootDir, `src/scenes/${id}`)
  const sceneFile = resolve(sceneDir, `${sceneName}.tsx`)
  const controlsFile = resolve(sceneDir, `${controlsName}.tsx`)
  const stateFile = resolve(sceneDir, `${stateHookName}.ts`)
  const rigFile = resolve(sceneDir, `${rigName}.tsx`)
  const cssFile = resolve(sceneDir, `${id}.css`)
  const testFile = resolve(sceneDir, `${sceneName}.test.tsx`)
  const catalogFile = resolve(rootDir, 'config/demo-scenes.json')

  await ensurePathMissing(sceneDir, `Scene directory already exists: src/scenes/${id}`)
  await mkdir(sceneDir, { recursive: true })

  const coreSummaryLines = buildCoreSummaryLines(coreLines)
  await writeFile(
    sceneFile,
    buildSceneTemplate({
      id,
      sceneName,
      controlsName,
      rigName,
      stateHookName,
      signalsLiteral,
      coreSummaryLines,
    }),
    'utf8',
  )
  await writeFile(
    controlsFile,
    buildControlsTemplate({ id, label, controlsName, signalString, stateTypeName, stateHookName }),
    'utf8',
  )
  await writeFile(stateFile, buildStateTemplate({ stateHookName, stateTypeName }), 'utf8')
  await writeFile(rigFile, buildRigTemplate({ rigName }), 'utf8')
  await writeFile(cssFile, buildCssTemplate(id), 'utf8')
  await writeFile(testFile, buildTestTemplate({ id, sceneName, label }), 'utf8')

  const catalogContent = await readFile(catalogFile, 'utf8')
  const catalog = JSON.parse(catalogContent)
  ensure(Array.isArray(catalog), 'config/demo-scenes.json must be an array')
  ensure(
    !catalog.some((entry) => entry.pageId === id),
    `Catalog entry for pageId "${id}" already exists in config/demo-scenes.json`,
  )

  catalog.push({
    pageId: id,
    label,
    meta: {
      tag,
      summary,
      highlights: [highlightA, highlightB],
      tone,
    },
    classroom: {
      presentationSignals: signals,
      coreSummaryLineCount: coreLines,
    },
    playwright: {
      readyText: `${label}控制`,
      screenshotName: id,
    },
  })
  await writeFile(catalogFile, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8')

  console.log('New scene scaffold created:')
  console.log(`- src/scenes/${id}/${sceneName}.tsx`)
  console.log(`- src/scenes/${id}/${stateHookName}.ts`)
  console.log(`- src/scenes/${id}/${controlsName}.tsx`)
  console.log(`- src/scenes/${id}/${rigName}.tsx`)
  console.log(`- src/scenes/${id}/${id}.css`)
  console.log(`- src/scenes/${id}/${sceneName}.test.tsx`)
  console.log('- config/demo-scenes.json (catalog entry appended)')
  console.log('- 自动场景发现将按 src/scenes/<id>/*Scene.tsx + *Scene 导出接入路由，无需手改 demoRoutes')
  console.log('\nNext steps:')
  console.log('1) Fill in useXxxSceneState domain logic and rig rendering details.')
  console.log('2) Update generated metadata/highlights to classroom-ready copy.')
  console.log('3) Run: npm test && npm run build')
}

main().catch((error) => {
  console.error('[scaffold:scene] failed:', error instanceof Error ? error.message : String(error))
  process.exit(1)
})
