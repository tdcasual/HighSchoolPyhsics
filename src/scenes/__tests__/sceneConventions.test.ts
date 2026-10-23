import { describe, expect, it } from 'vitest'

// Source text of every scene file (tests excluded), grouped by scene directory.
const sources = import.meta.glob<string>(
  ['../*/*.ts', '../*/*.tsx', '!../*/*.test.ts', '!../*/*.test.tsx', '!../__tests__/*'],
  {
    query: '?raw',
    import: 'default',
    eager: true,
  },
)

// Shared 3D parts outside the scenes follow the same drawing rules.
const sharedParts = import.meta.glob<string>(
  ['../../instruments/**/*.tsx', '../../domains/**/*.tsx', '!../../**/*.test.tsx', '!../../**/__tests__/**'],
  { query: '?raw', import: 'default', eager: true },
)

const scenes = new Map<string, string>()
const chartFiles: Array<[string, string]> = []
const sceneShells: Array<[string, string]> = []
const fileNames = new Map<string, string[]>()
for (const [path, text] of Object.entries(sources)) {
  const scene = path.split('/')[1]
  scenes.set(scene, (scenes.get(scene) ?? '') + '\n' + text)
  if (/Chart\.tsx$/.test(path)) chartFiles.push([path, text])
  if (/Scene\.tsx$/.test(path)) sceneShells.push([path, text])
  fileNames.set(scene, [...(fileNames.get(scene) ?? []), path.split('/').pop() ?? ''])
}

/**
 * Scenes whose 播放 is not a clock a teacher would step through. Each needs a reason; anything
 * else with a play action must offer 单步 (key 'step') in a meaningful unit.
 */
const NO_STEP: Record<string, string> = {
  'ideal-gas-isochoric': 'molecular motion is statistical; readings are equilibrium values',
  mhd: 'readings are steady-state values; the animation only illustrates flow and charge build-up',
}

/**
 * requestAnimationFrame outside the shared loop is only allowed for render scheduling, never
 * for advancing simulated time (that goes through simulation/useSimulationClock,
 * useAnimatedState or useAnimationLoop, which apply slow motion and the frame cap).
 */
const RAW_FRAME_LOOPS: Record<string, string> = {
  'double-slit': 'the 3D rig invalidates once more on the next frame after mounting; no simulated time',
}

/**
 * useFrame is for per-frame drawing that reads state, never for advancing what the class reads
 * (that ignores pause, slow motion and 单步). Each scene that uses it says what it draws.
 */
const FRAME_CALLBACKS: Record<string, string> = {
  'wave-interference': 'writes the clock time into the wave shader and samples the observer trace from it',
  'celestial-motion': 'splits the orbit into front and back halves as the camera moves',
  mhd: 'drifts the flow markers and carriers; the readings are steady-state values',
  'wedge-interference': 'sweeps the light curtain across the plate while 扫描 is on; nothing is read from it',
}

/**
 * Scenes whose playback zone is not play / 单步 / reset, so they list their actions by hand.
 * Everything else builds it with clockActions (simulation/clockActions).
 */
const HAND_PLAYBACK: Record<string, string> = {
  'vernier-caliper': 'nudge the jaw ± one division, explode and lock; there is no time',
  micrometer: 'turn the thimble ± one division, explode and lock; there is no time',
  'ticker-timer': 'the experiment is 通电 then 释放纸带, as in the lab',
  'induction-current': 'the teacher moves the magnet 接近 / 远离 the coil',
}

const hasPlayAction = (text: string) => /clockActions\(|key:\s*'(play|toggle-running)'/.test(text)
const hasStepAction = (text: string) => /\bstepLabel:|key:\s*'step'/.test(text)
const hasHandPlayback = (text: string) => /playbackActions=\{\[/.test(text)
const hasTeacherParameters = (text: string) => /<(RangeField|SegmentedControl|TextField)\b/.test(text)
// usePracticeState (shared by the measuring instruments) remembers through rememberFields.
const remembersParameters = (text: string) => /\b(recall|rememberFields)\(|\busePracticeState\b/.test(text)

describe('scene conventions', () => {
  it('finds the scenes', () => {
    expect(scenes.size).toBeGreaterThan(20)
  })

  it('offers 单步 wherever there is a play action', () => {
    const missing = [...scenes].filter(
      ([scene, text]) => hasPlayAction(text) && !hasStepAction(text) && !(scene in NO_STEP),
    )
    expect(missing.map(([scene]) => scene)).toEqual([])
  })

  it('keeps the 单步 exemptions current', () => {
    for (const scene of Object.keys(NO_STEP)) {
      expect(scenes.has(scene), scene).toBe(true)
      expect(hasStepAction(scenes.get(scene)!), `${scene} has 单步 now; drop the exemption`).toBe(false)
    }
  })

  it('builds the playback zone with clockActions', () => {
    const hand = [...scenes].filter(([scene, text]) => hasHandPlayback(text) && !(scene in HAND_PLAYBACK))
    expect(hand.map(([scene]) => scene)).toEqual([])
    for (const scene of Object.keys(HAND_PLAYBACK)) {
      expect(hasHandPlayback(scenes.get(scene) ?? ''), `${scene} uses clockActions now; drop the exemption`).toBe(true)
    }
  })

  it('advances simulated time only through the shared clock and loop', () => {
    const raw = [...scenes].filter(
      ([scene, text]) => /requestAnimationFrame\(/.test(text) && !(scene in RAW_FRAME_LOOPS),
    )
    expect(raw.map(([scene]) => scene)).toEqual([])
  })

  it('keeps the frame-loop exemptions current', () => {
    for (const scene of Object.keys(RAW_FRAME_LOOPS)) {
      expect(
        /requestAnimationFrame\(/.test(scenes.get(scene) ?? ''),
        `${scene} has no frame loop now; drop the exemption`,
      ).toBe(true)
    }
  })

  it('draws charts with the shared kit (ui/charts): ChartCard/ChartFrame, or its canvas hooks for optics', () => {
    expect(chartFiles.length).toBeGreaterThan(10)
    const custom = chartFiles.filter(([, text]) => !/ui\/charts\//.test(text))
    expect(custom.map(([path]) => path)).toEqual([])
  })

  it('fits every camera to the apparatus and the free area (FittedCanvas or useFittedOrbitCamera)', () => {
    const with3d = [...scenes].filter(([, text]) => /<(InteractiveCanvas|FittedCanvas)\b/.test(text))
    expect(with3d.length).toBeGreaterThan(20)
    const unfitted = with3d.filter(([, text]) => !/<FittedCanvas\b|useFittedOrbitCamera\(/.test(text))
    expect(unfitted.map(([scene]) => scene)).toEqual([])
    const literal = [...scenes].filter(([, text]) => /<InteractiveCanvas\b[^>]*?\bcamera=\{/s.test(text))
    expect(literal.map(([scene]) => scene)).toEqual([])
  })

  it('composes one view for every screen size (no phone or tablet camera branches in scene shells)', () => {
    const branched = sceneShells.filter(([, text]) => /MOBILE_BREAKPOINT|isTablet|innerWidth\s*<=/.test(text))
    expect(branched.map(([path]) => path)).toEqual([])
  })

  it('keeps the layered structure: useXxxSceneState + XxxControls + XxxScene', () => {
    const missing = [...fileNames].flatMap(([scene, names]) =>
      [/^use\w+SceneState\.ts$/, /^\w+Controls\.tsx$/, /^\w+Scene\.tsx$/]
        .filter((pattern) => !names.some((name) => pattern.test(name)))
        .map((pattern) => `${scene} ${pattern.source}`),
    )
    expect(missing).toEqual([])
  })

  it('shares code between scenes through domains/ or instruments/, never by importing another scene', () => {
    const crossImports = [...scenes].flatMap(([scene, text]) =>
      [...text.matchAll(/from '\.\.\/([a-z][a-z0-9-]*)\//g)].map((match) => `${scene} → ${match[1]}`),
    )
    expect(crossImports).toEqual([])
  })

  it('shares viewport measuring and framing helpers instead of copying them', () => {
    const copies = [...scenes].filter(([, text]) =>
      /function (useViewportSize|freeRects|fitCameraDistance)\b/.test(text),
    )
    expect(copies.map(([scene]) => scene)).toEqual([])
  })

  it('declares the data panel with DataRows', () => {
    const custom = [...scenes].filter(([, text]) => /dataOverlay=/.test(text) && !/<DataRows\b/.test(text))
    expect(custom.map(([scene]) => scene)).toEqual([])
  })

  it('remembers teacher-set parameters across scene switches', () => {
    const missing = [...scenes].filter(([, text]) => hasTeacherParameters(text) && !remembersParameters(text))
    expect(missing.map(([scene]) => scene)).toEqual([])
  })

  it('labels 3D parts with SceneLabel, never a hand-styled drei Html', () => {
    const files = [...Object.entries(sources), ...Object.entries(sharedParts)]
    const raw = files.filter(
      ([, text]) => /from '@react-three\/drei(\/web\/Html)?'/.test(text) && /\bHtml\b/.test(text),
    )
    expect(raw.map(([path]) => path)).toEqual([])
  })

  it('draws arrows with scene3d/Arrow3D instead of hand-built cones', () => {
    const files = [...Object.entries(sources), ...Object.entries(sharedParts)]
    const handBuilt = files.flatMap(([path, text]) =>
      text
        .split(/\n(?=(?:export )?function )/)
        .filter((chunk) => /^(?:export )?function \w*Arrow\w*\(/.test(chunk) && /<coneGeometry\b/.test(chunk))
        .map((chunk) => `${path}: ${chunk.match(/function (\w+)/)?.[1]}`),
    )
    expect(handBuilt).toEqual([])
  })

  it('keeps useFrame to drawing (each use listed with what it draws)', () => {
    const uses = [...scenes].filter(([, text]) => /\buseFrame\(/.test(text)).map(([scene]) => scene)
    expect(uses.sort()).toEqual(Object.keys(FRAME_CALLBACKS).sort())
  })
})
