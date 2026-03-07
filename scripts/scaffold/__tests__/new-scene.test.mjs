import { execFile } from 'node:child_process'
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { constants } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { afterEach, describe, expect, it } from 'vitest'

const execFileAsync = promisify(execFile)
const SCRIPT_PATH = path.resolve(process.cwd(), 'scripts/scaffold/new-scene.mjs')
const createdTempDirs = []

async function assertExists(filePath) {
  await access(filePath, constants.F_OK)
}

async function runScaffold(cwd, extraArgs = []) {
  await execFileAsync(
    process.execPath,
    [
      SCRIPT_PATH,
      '--id',
      'hall-effect',
      '--label',
      '霍尔效应',
      '--tone',
      'mhd',
      '--signals',
      'chart,live-metric',
      '--core-lines',
      '4',
      ...extraArgs,
    ],
    { cwd },
  )
}

describe('scene scaffold generator', () => {

  it('rejects ambiguous classroom semantics without an explicit scene kind', async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), '3dmotion-scaffold-'))
    createdTempDirs.push(rootDir)

    await mkdir(path.join(rootDir, 'config'), { recursive: true })
    await mkdir(path.join(rootDir, 'src/scenes'), { recursive: true })
    await writeFile(path.join(rootDir, 'config/demo-scenes.json'), '[]\n', 'utf8')

    await expect(runScaffold(rootDir)).rejects.toThrow(/--scene-kind/)
  })

  afterEach(async () => {
    await Promise.all(createdTempDirs.map((dirPath) => rm(dirPath, { recursive: true, force: true })))
    createdTempDirs.length = 0
  })


  it('writes a classroom-contract-complete catalog entry', async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), '3dmotion-scaffold-'))
    createdTempDirs.push(rootDir)

    await mkdir(path.join(rootDir, 'config'), { recursive: true })
    await mkdir(path.join(rootDir, 'src/scenes'), { recursive: true })
    await writeFile(path.join(rootDir, 'config/demo-scenes.json'), '[]\n', 'utf8')

    await runScaffold(rootDir, ['--scene-kind', 'field'])

    const catalog = JSON.parse(await readFile(path.join(rootDir, 'config/demo-scenes.json'), 'utf8'))
    const entry = catalog[0]

    expect(entry.classroom.sceneKind).toBe('field')
    expect(entry.classroom.smartPresentation).toEqual({
      layout: 'enter-only',
      focus: false,
      stickySummary: false,
    })
  })


  it('allows explicit smart-presentation overrides', async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), '3dmotion-scaffold-'))
    createdTempDirs.push(rootDir)

    await mkdir(path.join(rootDir, 'config'), { recursive: true })
    await mkdir(path.join(rootDir, 'src/scenes'), { recursive: true })
    await writeFile(path.join(rootDir, 'config/demo-scenes.json'), '[]\n', 'utf8')

    await runScaffold(rootDir, [
      '--scene-kind',
      'field',
      '--smart-layout',
      'staged',
      '--smart-focus',
      'true',
      '--smart-sticky-summary',
      'true',
    ])

    const catalog = JSON.parse(await readFile(path.join(rootDir, 'config/demo-scenes.json'), 'utf8'))
    const entry = catalog[0]

    expect(entry.classroom.smartPresentation).toEqual({
      layout: 'staged',
      focus: true,
      stickySummary: true,
    })
  })

  it('generates layered scene modules by default', async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), '3dmotion-scaffold-'))
    createdTempDirs.push(rootDir)

    await mkdir(path.join(rootDir, 'config'), { recursive: true })
    await mkdir(path.join(rootDir, 'src/scenes'), { recursive: true })
    await writeFile(path.join(rootDir, 'config/demo-scenes.json'), '[]\n', 'utf8')

    await runScaffold(rootDir, ['--scene-kind', 'field'])

    const sceneDir = path.join(rootDir, 'src/scenes/hall-effect')
    const sceneFile = path.join(sceneDir, 'HallEffectScene.tsx')
    const stateFile = path.join(sceneDir, 'useHallEffectSceneState.ts')
    const controlsFile = path.join(sceneDir, 'HallEffectControls.tsx')
    const rigFile = path.join(sceneDir, 'HallEffectRig3D.tsx')

    await assertExists(sceneFile)
    await assertExists(stateFile)
    await assertExists(controlsFile)
    await assertExists(rigFile)

    const sceneSource = await readFile(sceneFile, 'utf8')
    expect(sceneSource).toContain("import { useHallEffectSceneState } from './useHallEffectSceneState'")
    expect(sceneSource).toContain("import { HallEffectControls } from './HallEffectControls'")
    expect(sceneSource).toContain("import { HallEffectRig3D } from './HallEffectRig3D'")
    expect(sceneSource).toContain('<HallEffectControls')
    expect(sceneSource).toContain('<HallEffectRig3D')
  })
})
