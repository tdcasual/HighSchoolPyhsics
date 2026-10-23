// Creates a new scene on the shared classroom architecture and registers it.
//   npm run scaffold:scene -- --id hall-effect --label 霍尔效应 \
//     --chapter lorentz-force --topic magnetic-field --lesson models [--tag 磁场] [--summary …]
// Writes src/scenes/<id>/ (state hook with the shared clock, controls, rig, scene, structure
// test), appends the catalog entry to config/demo-scenes.json and the navigation row to
// src/ui/navigation/sceneNavigation.ts. Then: npm run thumbnails -- <id>.
import { constants } from 'node:fs'
import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const VALID_TONES = new Set(['scope', 'cyclotron', 'mhd', 'oersted'])
const VALID_LESSONS = new Set(['experiments', 'models', 'phenomena'])

function parseArgs(argv) {
  const args = new Map()
  for (let index = 0; index < argv.length; index += 1) {
    const raw = argv[index]
    if (!raw.startsWith('--')) continue
    const next = argv[index + 1]
    if (!next || next.startsWith('--')) {
      args.set(raw.slice(2), 'true')
      continue
    }
    args.set(raw.slice(2), next)
    index += 1
  }
  return args
}

function ensure(value, message) {
  if (!value) throw new Error(message)
}

async function ensurePathMissing(path, message) {
  try {
    await access(path, constants.F_OK)
  } catch {
    return
  }
  throw new Error(message)
}

function toPascalCase(id) {
  return id
    .split('-')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join('')
}

export function buildStateTemplate({ id, base }) {
  return `import { useState } from 'react'
import { recall, useRemember } from '../../app/sceneMemory/sceneMemory'
import { useSimulationClock, type SimulationClock } from '../../simulation/useSimulationClock'

const DEFAULT_INTENSITY = 1
/** 单步: a meaningful unit for this process (T/4, 15°, 0.1 s …). */
const STEP_S = 0.1

export type ${base}SceneState = {
  clock: SimulationClock
  /** Simulated time in seconds. */
  timeS: number
  intensity: number
  setIntensity: (value: number) => void
  reset: () => void
}

export function use${base}SceneState(): ${base}SceneState {
  const [intensity, setIntensity] = useState(() => recall('${id}.intensity', DEFAULT_INTENSITY))
  useRemember('${id}', { intensity })
  const [timeS, setTimeS] = useState(0)
  // Describe what happens in dt seconds; the clock handles play, pause, 单步 and slow motion.
  const clock = useSimulationClock({
    stepSeconds: STEP_S,
    advance: (dt) => setTimeS((value) => value + dt),
  })

  return {
    clock,
    timeS,
    intensity,
    setIntensity,
    reset: () => {
      clock.pause()
      setTimeS(0)
      setIntensity(DEFAULT_INTENSITY)
    },
  }
}
`
}

export function buildControlsTemplate({ id, label, base }) {
  return `import { ControlSection } from '../../ui/controls/ControlSection'
import { RangeField } from '../../ui/controls/RangeField'
import type { ${base}SceneState } from './use${base}SceneState'

export function ${base}Controls({ state }: { state: ${base}SceneState }) {
  return (
    <div className="grid gap-[0.8rem]">
      <h2>${label}控制</h2>
      <ControlSection title="参数">
        <RangeField
          id="${id}-intensity"
          label="核心量"
          min={0}
          max={10}
          step={0.1}
          value={state.intensity}
          onChange={state.setIntensity}
        />
      </ControlSection>
    </div>
  )
}
`
}

export function buildRigTemplate({ base }) {
  return `import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Mesh } from 'three'

export function ${base}Rig3D({ timeS, intensity }: { timeS: number; intensity: number }) {
  const mesh = useRef<Mesh>(null)
  useFrame(() => {
    if (mesh.current) mesh.current.rotation.y = timeS
  })
  return (
    <group>
      <ambientLight intensity={0.8} />
      <directionalLight position={[3.6, 4.8, 2.8]} intensity={0.95} />
      <mesh ref={mesh}>
        <boxGeometry args={[1 + intensity * 0.05, 1, 1]} />
        <meshStandardMaterial color="#2f95d5" roughness={0.35} metalness={0.2} />
      </mesh>
    </group>
  )
}
`
}

export function buildSceneTemplate({ base }) {
  return `import { FittedCanvas } from '../../scene3d/FittedCanvas'
import { clockActions } from '../../simulation/clockActions'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { DataRows } from '../../ui/panels/DataRows'
import { ${base}Controls } from './${base}Controls'
import { ${base}Rig3D } from './${base}Rig3D'
import { use${base}SceneState } from './use${base}SceneState'

export function ${base}Scene() {
  const state = use${base}SceneState()
  const { clock } = state

  return (
    <SceneLayout
      timeControl
      controls={<${base}Controls state={state} />}
      dataOverlay={
        <DataRows
          rows={[
            { label: '时刻 t', value: \`\${state.timeS.toFixed(2)} s\` },
            { label: '核心量', value: state.intensity.toFixed(1) },
            { label: '结论', value: '待补充', answer: true },
          ]}
        />
      }
      notes={<p>模型假设与公式写在这里，默认折叠在侧栏末尾。</p>}
      playbackActions={clockActions(clock, { stepLabel: '单步 0.1 s', onReset: state.reset })}
      viewport={
        <FittedCanvas shot={{ from: [0, 1.8, 5.2], to: [0, 0, 0] }} fov={42} frameloop={clock.frameloop}>
          <${base}Rig3D timeS={state.timeS} intensity={state.intensity} />
        </FittedCanvas>
      }
    />
  )
}

export default ${base}Scene
`
}

export function buildTestTemplate({ id, label, base }) {
  return `import type { ReactNode } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../scene3d/InteractiveCanvas', () => ({
  InteractiveCanvas: ({ children }: { children: ReactNode }) => <div data-testid="interactive-canvas">{children}</div>,
}))
vi.mock('../${base}Rig3D', () => ({ ${base}Rig3D: () => null }))

import { ${base}Scene } from '../${base}Scene'

describe('${id} structure', () => {
  it('opens with controls, readings and a working 单步', () => {
    render(<${base}Scene />)
    expect(screen.getByRole('heading', { name: '${label}控制' })).toBeInTheDocument()
    const data = screen.getByRole('region', { name: '数据' })
    expect(within(data).getByText('0.00 s')).toBeInTheDocument()
    fireEvent.click(within(screen.getByRole('region', { name: '播放控制' })).getByRole('button', { name: '单步 0.1 s' }))
    expect(within(data).getByText('0.10 s')).toBeInTheDocument()
  })
})
`
}

/** Appends `{ pageId, chapter, topic, lesson }` before the closing bracket of SCENE_NAVIGATION. */
export function insertNavigationRow(source, row) {
  const start = source.indexOf('export const SCENE_NAVIGATION')
  ensure(start >= 0, 'SCENE_NAVIGATION not found in sceneNavigation.ts')
  const close = source.indexOf('\n]', start)
  ensure(close >= 0, 'end of SCENE_NAVIGATION not found')
  const line = `\n  { pageId: '${row.pageId}', chapter: '${row.chapter}', topic: '${row.topic}', lesson: '${row.lesson}' },`
  return source.slice(0, close) + line + source.slice(close)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const id = args.get('id')
  const label = args.get('label')
  const chapter = args.get('chapter')
  const topic = args.get('topic')
  const lesson = args.get('lesson')
  const tone = args.get('tone') ?? 'scope'

  ensure(id, 'Missing --id (example: --id hall-effect)')
  ensure(/^[a-z][a-z0-9-]*$/.test(id), '--id must match ^[a-z][a-z0-9-]*$')
  ensure(label, 'Missing --label (example: --label 霍尔效应)')
  ensure(chapter, 'Missing --chapter: a PHYSICS_REGIONS id in src/ui/navigation/regionData.ts')
  ensure(topic, 'Missing --topic: a topic group id in src/ui/navigation/navigationViews.ts')
  ensure(VALID_LESSONS.has(lesson), `--lesson must be one of: ${[...VALID_LESSONS].join(', ')}`)
  ensure(VALID_TONES.has(tone), `--tone must be one of: ${[...VALID_TONES].join(', ')}`)

  const base = toPascalCase(id)
  const rootDir = process.cwd()
  const sceneDir = resolve(rootDir, `src/scenes/${id}`)
  const catalogFile = resolve(rootDir, 'config/demo-scenes.json')
  const navigationFile = resolve(rootDir, 'src/ui/navigation/sceneNavigation.ts')

  await ensurePathMissing(sceneDir, `Scene directory already exists: src/scenes/${id}`)
  const catalog = JSON.parse(await readFile(catalogFile, 'utf8'))
  ensure(Array.isArray(catalog), 'config/demo-scenes.json must be an array')
  ensure(!catalog.some((entry) => entry.pageId === id), `pageId "${id}" already exists in config/demo-scenes.json`)
  const navigation = await readFile(navigationFile, 'utf8')

  await mkdir(resolve(sceneDir, '__tests__'), { recursive: true })
  await writeFile(resolve(sceneDir, `use${base}SceneState.ts`), buildStateTemplate({ id, base }), 'utf8')
  await writeFile(resolve(sceneDir, `${base}Controls.tsx`), buildControlsTemplate({ id, label, base }), 'utf8')
  await writeFile(resolve(sceneDir, `${base}Rig3D.tsx`), buildRigTemplate({ base }), 'utf8')
  await writeFile(resolve(sceneDir, `${base}Scene.tsx`), buildSceneTemplate({ base }), 'utf8')
  await writeFile(resolve(sceneDir, '__tests__/structure.test.tsx'), buildTestTemplate({ id, label, base }), 'utf8')

  catalog.push({
    pageId: id,
    label,
    meta: {
      tag: args.get('tag') ?? '课堂演示',
      summary: args.get('summary') ?? `${label}场景`,
      highlights: [args.get('highlight-a') ?? '核心现象可视化', args.get('highlight-b') ?? '参数联动观察'],
      tone,
    },
    playwright: { readyText: `${label}控制`, screenshotName: id },
  })
  await writeFile(catalogFile, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8')
  await writeFile(navigationFile, insertNavigationRow(navigation, { pageId: id, chapter, topic, lesson }), 'utf8')

  console.log(
    `New scene created in src/scenes/${id}/ and registered in config/demo-scenes.json and sceneNavigation.ts.`,
  )
  console.log('Next:')
  console.log('1) Move the navigation row to its place in textbook teaching order.')
  console.log('2) Replace the placeholder state, readings (DataRows, answer: true for conclusions), notes and rig.')
  console.log(`3) npm test, then npm run thumbnails -- ${id} and npm run test:visual-smoke:update -- ${id}.`)
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  main().catch((error) => {
    console.error('[scaffold:scene] failed:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}
