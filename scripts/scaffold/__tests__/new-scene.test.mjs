import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { afterEach, describe, expect, it } from 'vitest'
import { insertNavigationRow } from '../new-scene.mjs'

const execFileAsync = promisify(execFile)
const SCRIPT_PATH = path.resolve(process.cwd(), 'scripts/scaffold/new-scene.mjs')
const createdTempDirs = []

const NAVIGATION = `export const SCENE_NAVIGATION: readonly SceneNavigation[] = [
  { pageId: 'mhd', chapter: 'lorentz-force', topic: 'magnetic-field', lesson: 'phenomena' },
]
`

async function fakeRepo() {
  const rootDir = await mkdtemp(path.join(tmpdir(), 'scene-scaffold-'))
  createdTempDirs.push(rootDir)
  await mkdir(path.join(rootDir, 'config'), { recursive: true })
  await mkdir(path.join(rootDir, 'src/scenes'), { recursive: true })
  await mkdir(path.join(rootDir, 'src/ui/navigation'), { recursive: true })
  await writeFile(path.join(rootDir, 'config/demo-scenes.json'), '[]\n', 'utf8')
  await writeFile(path.join(rootDir, 'src/ui/navigation/sceneNavigation.ts'), NAVIGATION, 'utf8')
  return rootDir
}

function run(cwd, extra = []) {
  return execFileAsync(process.execPath, [
    SCRIPT_PATH, '--id', 'hall-effect', '--label', '霍尔效应',
    '--chapter', 'lorentz-force', '--topic', 'magnetic-field', '--lesson', 'models', ...extra,
  ], { cwd })
}

describe('scene scaffold generator', () => {
  afterEach(async () => {
    await Promise.all(createdTempDirs.map((dir) => rm(dir, { recursive: true, force: true })))
    createdTempDirs.length = 0
  })

  it('generates a scene on the shared clock, DataRows and scene memory', async () => {
    const rootDir = await fakeRepo()
    await run(rootDir)
    const dir = path.join(rootDir, 'src/scenes/hall-effect')
    const scene = await readFile(path.join(dir, 'HallEffectScene.tsx'), 'utf8')
    const state = await readFile(path.join(dir, 'useHallEffectSceneState.ts'), 'utf8')
    expect(scene).toContain('<DataRows')
    expect(scene).toContain('clockActions(clock')
    expect(scene).toContain('notes=')
    expect(scene).toContain('<FittedCanvas')
    expect(state).toContain('useSimulationClock(')
    expect(state).toContain("recall('hall-effect.intensity'")
    expect(state).not.toContain('requestAnimationFrame')
    await readFile(path.join(dir, '__tests__/structure.test.tsx'), 'utf8')
  })

  it('registers the scene in the catalog and the navigation table', async () => {
    const rootDir = await fakeRepo()
    await run(rootDir, ['--tag', '磁场'])
    const [entry] = JSON.parse(await readFile(path.join(rootDir, 'config/demo-scenes.json'), 'utf8'))
    expect(entry).toMatchObject({ pageId: 'hall-effect', label: '霍尔效应', meta: { tag: '磁场' }, playwright: { readyText: '霍尔效应控制' } })
    const navigation = await readFile(path.join(rootDir, 'src/ui/navigation/sceneNavigation.ts'), 'utf8')
    expect(navigation).toContain("{ pageId: 'hall-effect', chapter: 'lorentz-force', topic: 'magnetic-field', lesson: 'models' },\n]")
  })

  it('requires the navigation placement and refuses duplicates', async () => {
    const rootDir = await fakeRepo()
    await expect(execFileAsync(process.execPath, [SCRIPT_PATH, '--id', 'x', '--label', 'X'], { cwd: rootDir })).rejects.toThrow(/--chapter/)
    await run(rootDir)
    await expect(run(rootDir)).rejects.toThrow(/already exists/)
  })

  it('inserts the navigation row before the closing bracket', () => {
    expect(insertNavigationRow(NAVIGATION, { pageId: 'a', chapter: 'b', topic: 'c', lesson: 'models' }))
      .toContain("lesson: 'phenomena' },\n  { pageId: 'a', chapter: 'b', topic: 'c', lesson: 'models' },\n]")
  })
})
