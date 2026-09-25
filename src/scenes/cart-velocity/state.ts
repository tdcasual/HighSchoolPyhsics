import {
  DURATION,
  MAX_HOOKS,
  fit,
  hookAcceleration,
  measurements,
  type MotionInput,
  type SpeedPoint,
} from './model'
import { motionOf, type CartSkin, type CartStage } from './pose'

export type CartRun = { hooks: number; v0: number; dh: number; a: number }

export type CartState = {
  stage: CartStage
  view: 'home' | 'front' | 'top' | 'focus'
  assembly: number
  time: number
  running: boolean
  speed: number
  hooks: number
  v0: number
  dh: number
  group: number
  skin: CartSkin
  selected: number
  runs: CartRun[]
  notice: string
}

export function createCartState(): CartState {
  return {
    stage: 'run',
    view: 'home',
    assembly: 0,
    time: 0,
    running: false,
    speed: 0.25,
    hooks: 3,
    v0: 0.1,
    dh: 0,
    group: 5,
    skin: 'classic',
    selected: 1,
    runs: [],
    notice: '先接通打点计时器，再让小车运动。可用慢放和单步。',
  }
}

export function motionInput(state: CartState): MotionInput {
  return motionOf(state)
}

export function isAnimating(state: CartState): boolean {
  return state.running && state.time < DURATION
}

function remember(state: CartState): CartRun[] {
  const run = { hooks: state.hooks, v0: state.v0, dh: state.dh, a: hookAcceleration(state.hooks) }
  const key = `${run.hooks}|${run.v0}|${run.dh}`
  return state.runs
    .filter((item) => `${item.hooks}|${item.v0}|${item.dh}` !== key)
    .concat(run)
    .sort((a, b) => a.hooks - b.hooks || a.v0 - b.v0 || a.dh - b.dh)
}

export function advanceCart(state: CartState, dt: number): CartState {
  if (!state.running) return state
  const time = Math.min(DURATION, state.time + dt)
  const finished = time >= DURATION
  return {
    ...state,
    time,
    running: finished ? false : state.running,
    runs: finished ? remember(state) : state.runs,
    notice: finished ? '本次记录完成，可以测纸带、看图像。' : state.notice,
  }
}

export function setHooks(state: CartState, hooks: number): CartState {
  const next = Math.max(0, Math.min(MAX_HOOKS, Math.round(hooks)))
  return {
    ...state,
    hooks: next,
    time: 0,
    running: false,
    selected: 1,
    notice: next ? `挂 ${next} 个钩码，理论加速度约 ${hookAcceleration(next).toFixed(3)} m/s²。` : '不挂钩码：小车以初速度匀速运动。',
  }
}

export function currentPoints(state: CartState): SpeedPoint[] {
  return measurements(state.time, motionInput(state), state.group)
}

export function selectedPoint(state: CartState): SpeedPoint | null {
  const rows = currentPoints(state)
  return rows.find((row) => row.index === state.selected) ?? rows[0] ?? null
}

export function runFit(run: CartRun, group: number) {
  return fit(measurements(DURATION, { a: run.a, v0: run.v0, dh: run.dh }, group))
}

export function compareAll(state: CartState): CartState {
  let runs = state.runs
  for (let hooks = 1; hooks <= MAX_HOOKS; hooks += 1) {
    runs = remember({ ...state, runs, hooks })
  }
  return { ...state, running: false, runs, notice: '已按当前初速度和滑轮高度生成 1 到 5 个钩码的对比。' }
}

export const ASSEMBLY_STEPS = [
  '放置长木板，把定滑轮固定在木板一端',
  '安装小车，检查运动方向',
  '固定计时器与复写纸',
  '穿过纸带，将一端固定到小车',
  '连接低压交流电源',
  '细线跨过滑轮挂钩码，调节滑轮高度使细线与木板平行',
]

export function stepCart(state: CartState): CartState {
  if (state.stage === 'assemble' && state.assembly < 5) {
    return { ...state, notice: '先把钩码和滑轮装上，再开始运动。' }
  }
  const next = advanceCart({ ...state, running: true }, 0.02)
  return {
    ...next,
    running: false,
    notice: next.time >= DURATION ? next.notice : '单步前进 0.02 s，新增一个打点。',
  }
}

export function applyPreset(state: CartState, preset: 'uniform' | 'accelerated'): CartState {
  const uniform = preset === 'uniform'
  return {
    ...state,
    hooks: uniform ? 0 : 3,
    v0: uniform ? 0.2 : 0.1,
    time: 0,
    running: false,
    selected: 1,
    notice: uniform ? '匀速对照：不挂钩码，初速度 0.20 m/s。' : '匀加速观察：3 个钩码，初速度 0.10 m/s。',
  }
}

export function clearRuns(state: CartState): CartState {
  return { ...state, runs: [], notice: '已清空对比数据。' }
}

export function assemblyMove(state: CartState, direction: 1 | -1): CartState {
  if (direction > 0 && state.assembly >= 5) {
    return { ...state, stage: 'run', running: false, notice: '装配完成，可以开始实验。' }
  }
  const assembly = Math.max(0, Math.min(5, state.assembly + direction))
  return { ...state, assembly, notice: ASSEMBLY_STEPS[assembly] }
}
