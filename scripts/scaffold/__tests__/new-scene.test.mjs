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
  return execFileAsync(
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


  it('reports follow-up guidance that matches the script workflow', async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), '3dmotion-scaffold-'))
    createdTempDirs.push(rootDir)

    await mkdir(path.join(rootDir, 'config'), { recursive: true })
    await mkdir(path.join(rootDir, 'src/scenes'), { recursive: true })
    await writeFile(path.join(rootDir, 'config/demo-scenes.json'), '[]\n', 'utf8')

    const { stdout } = await runScaffold(rootDir, ['--scene-kind', 'field'])

    expect(stdout).toContain('edit the generated catalog entry/files directly')
    expect(stdout).toContain('delete src/scenes/hall-effect before rerunning with overrides')
    expect(stdout).not.toContain('If needed, regenerate with --scene-kind')
  })

  it('does not leave a generated scene directory behind when catalog append fails', async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), '3dmotion-scaffold-'))
    createdTempDirs.push(rootDir)

    await mkdir(path.join(rootDir, 'config'), { recursive: true })
    await mkdir(path.join(rootDir, 'src/scenes'), { recursive: true })
    await writeFile(
      path.join(rootDir, 'config/demo-scenes.json'),
      `${JSON.stringify([
        {
          pageId: 'hall-effect',
          label: '已存在的霍尔效应',
          meta: {
            tag: '课堂演示',
            summary: 'existing',
            highlights: ['a', 'b'],
            tone: 'mhd',
          },
          touchProfile: {
            pageScroll: 'vertical-outside-canvas',
            canvasGestureScope: 'interactive-canvas',
            minTouchTargetPx: 44,
            gestureMatrix: {
              singleFingerRotate: true,
              twoFingerZoom: true,
              twoFingerPan: true,
            },
          },
          classroom: {
            presentationSignals: ['chart'],
            coreSummaryLineCount: 3,
            sceneKind: 'field',
            smartPresentation: {
              layout: 'enter-only',
              focus: false,
              stickySummary: false,
            },
          },
          playwright: {
            readyText: '已存在的霍尔效应控制',
            screenshotName: 'hall-effect',
          },
        },
      ], null, 2)}\n`,
      'utf8',
    )

    await expect(runScaffold(rootDir, ['--scene-kind', 'field'])).rejects.toThrow(
      /Catalog entry for pageId "hall-effect" already exists/,
    )
    await expect(access(path.join(rootDir, 'src/scenes/hall-effect'), constants.F_OK)).rejects.toMatchObject({
      code: 'ENOENT',
    })
  })

  it('generates signal-specific placeholders for chart-centric scenes', async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), '3dmotion-scaffold-'))
    createdTempDirs.push(rootDir)

    await mkdir(path.join(rootDir, 'config'), { recursive: true })
    await mkdir(path.join(rootDir, 'src/scenes'), { recursive: true })
    await writeFile(path.join(rootDir, 'config/demo-scenes.json'), '[]\n', 'utf8')

    await runScaffold(rootDir, ['--scene-kind', 'trajectory', '--signals', 'chart,time-series,live-metric'])

    const controlsFile = path.join(rootDir, 'src/scenes/hall-effect/HallEffectControls.tsx')
    const controlsSource = await readFile(controlsFile, 'utf8')
    const testFile = path.join(rootDir, 'src/scenes/hall-effect/HallEffectScene.test.tsx')
    const testSource = await readFile(testFile, 'utf8')

    expect(controlsSource).toContain('data-presentation-signal="live-metric"')
    expect(controlsSource).toContain('data-presentation-signal="chart time-series"')
    expect(controlsSource).toContain('趋势图占位')
    expect(controlsSource).not.toContain('data-presentation-signal="chart time-series live-metric"')
    expect(testSource).toContain('findByText(/当前读数:/)')
    expect(testSource).toContain('findByText(/时间序列趋势图占位/)')
  })

  it('generates signal-aware scene tests for non-metric scenes', async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), '3dmotion-scaffold-'))
    createdTempDirs.push(rootDir)

    await mkdir(path.join(rootDir, 'config'), { recursive: true })
    await mkdir(path.join(rootDir, 'src/scenes'), { recursive: true })
    await writeFile(path.join(rootDir, 'config/demo-scenes.json'), '[]\n', 'utf8')

    await runScaffold(rootDir, ['--scene-kind', 'structure', '--signals', 'interactive-readout'])

    const testFile = path.join(rootDir, 'src/scenes/hall-effect/HallEffectScene.test.tsx')
    const testSource = await readFile(testFile, 'utf8')

    expect(testSource).toContain('findByText(/课堂观察:/)')
    expect(testSource).not.toContain('findByText(/当前读数:/)')
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

  it('fails with a descriptive error when existing catalog entries are malformed', async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), '3dmotion-scaffold-'))
    createdTempDirs.push(rootDir)

    await mkdir(path.join(rootDir, 'config'), { recursive: true })
    await mkdir(path.join(rootDir, 'src/scenes'), { recursive: true })
    await writeFile(
      path.join(rootDir, 'config/demo-scenes.json'),
      JSON.stringify([null], null, 2) + '\n',
      'utf8',
    )

    await expect(runScaffold(rootDir, ['--scene-kind', 'field'])).rejects.toThrow(
      /config\/demo-scenes\.json entry\[0\] must be an object/i,
    )
  })
})
