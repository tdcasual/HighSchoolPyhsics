import { describe, expect, it } from 'vitest'

// Source text of every scene file (tests excluded), grouped by scene directory.
const sources = import.meta.glob<string>(['../*/*.ts', '../*/*.tsx', '!../*/*.test.ts', '!../*/*.test.tsx', '!../__tests__/*'], {
  query: '?raw',
  import: 'default',
  eager: true,
})

const scenes = new Map<string, string>()
for (const [path, text] of Object.entries(sources)) {
  const scene = path.split('/')[1]
  scenes.set(scene, (scenes.get(scene) ?? '') + '\n' + text)
}

/**
 * Scenes whose 播放 is not a clock a teacher would step through. Each needs a reason; anything
 * else with a play action must offer 单步 (key 'step') in a meaningful unit.
 */
const NO_STEP: Record<string, string> = {
  'ideal-gas-isochoric': 'molecular motion is statistical; readings are equilibrium values',
  mhd: 'readings are steady-state values; the animation only illustrates flow and charge build-up',
  'potential-energy': '播放 sweeps the potential surface into view; no physical time',
}

const hasPlayAction = (text: string) => /key:\s*'(play|toggle-running)'/.test(text)
const hasStepAction = (text: string) => /key:\s*'step'/.test(text)
const hasTeacherParameters = (text: string) => /<(RangeField|SegmentedControl|TextField)\b/.test(text)
// usePracticeState (shared by the measuring instruments) remembers through rememberFields.
const remembersParameters = (text: string) => /\b(recall|rememberFields)\(|\busePracticeState\b/.test(text)

describe('scene conventions', () => {
  it('finds the scenes', () => {
    expect(scenes.size).toBeGreaterThan(20)
  })

  it('offers 单步 wherever there is a play action', () => {
    const missing = [...scenes].filter(([scene, text]) => hasPlayAction(text) && !hasStepAction(text) && !(scene in NO_STEP))
    expect(missing.map(([scene]) => scene)).toEqual([])
  })

  it('keeps the 单步 exemptions current', () => {
    for (const scene of Object.keys(NO_STEP)) {
      expect(scenes.has(scene), scene).toBe(true)
      expect(hasStepAction(scenes.get(scene)!), `${scene} has 单步 now; drop the exemption`).toBe(false)
    }
  })

  it('remembers teacher-set parameters across scene switches', () => {
    const missing = [...scenes].filter(([, text]) => hasTeacherParameters(text) && !remembersParameters(text))
    expect(missing.map(([scene]) => scene)).toEqual([])
  })
})
