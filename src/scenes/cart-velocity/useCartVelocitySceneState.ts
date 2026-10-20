import { rememberFields, useRememberFields } from '../../app/sceneMemory/sceneMemory'
import { useAnimatedState } from '../../simulation/useAnimatedState'
import { DURATION } from './model'
import type { ViewPreset } from '../../scene3d/orbitFraming'
import {
  advanceCart,
  applyPreset,
  assemblyMove,
  clearRuns,
  compareAll,
  createCartState,
  currentPoints,
  isAnimating,
  selectedPoint,
  setHooks,
  stepCart,
  type CartState,
} from './state'
import type { CartPart, CartSkin, CartStage } from './pose'

/** Teacher-set parameters restored when the scene is opened again (run state is not). */
const REMEMBERED_FIELDS = ['stage', 'speed', 'hooks', 'v0', 'dh', 'group', 'skin', 'showFit', 'showSlopeTriangle'] as const

export function useCartVelocitySceneState() {
  const { state: simulation, commit } = useAnimatedState<CartState>(
    () => rememberFields('cart-velocity', createCartState(), REMEMBERED_FIELDS),
    (state, dt) => advanceCart(state, dt * state.speed),
    isAnimating,
    { maxFrameSeconds: 0.08 },
  )
  useRememberFields('cart-velocity', simulation, REMEMBERED_FIELDS)
  const animating = isAnimating(simulation)

  const points = currentPoints(simulation)
  const selected = selectedPoint(simulation)

  return {
    ...simulation,
    animating,
    points,
    selected,
    toggleRunning: () => commit((state) => {
      if (state.stage === 'assemble') {
        return { ...state, notice: '先完成装配，再开始运动。' }
      }
      if (state.time >= DURATION) return { ...state, time: 0, running: true, notice: '再做一次。' }
      return { ...state, running: !state.running, notice: state.running ? '已暂停。' : '小车运动中，纸带正在打点。' }
    }),
    step: () => commit(stepCart),
    setTime: (time: number) => commit((state) => ({ ...state, time: Math.max(0, Math.min(DURATION, time)), running: false })),
    setSpeed: (speed: number) => commit((state) => ({ ...state, speed })),
    setHooks: (hooks: number) => commit((state) => setHooks(state, hooks)),
    setV0: (v0: number) => commit((state) => ({ ...state, v0, time: 0, running: false })),
    setDh: (dh: number) => commit((state) => ({ ...state, dh, time: 0, running: false, notice: Math.abs(dh) >= 0.0025 ? '细线不再与木板平行，加速度会随位置变化。' : '细线已与木板平行。' })),
    setGroup: (group: number) => commit((state) => ({ ...state, group })),
    setSkin: (skin: CartSkin) => commit((state) => ({ ...state, skin })),
    setStage: (stage: CartStage) => commit((state) => ({
      ...state,
      stage,
      view: state.focusPart && stage !== state.stage ? 'home' : state.view,
      focusPart: stage !== state.stage ? null : state.focusPart,
      running: false,
      time: stage === 'assemble' || stage === 'observe' ? 0 : state.time,
      assembly: stage === 'assemble' ? 0 : state.assembly,
      notice: stage === 'assemble'
        ? '从长木板开始分步装配。'
        : stage === 'observe'
          ? '装置已组装就绪，观察运动轨道、打点计时器和纸带。'
          : stage === 'run'
            ? '装置已就绪：开始实验记录纸带，也可单步观察每个打点。'
            : stage === 'measure'
              ? '选择计数间隔和计数点，用中央差分估算中间时刻速度。'
              : '拟合纸带测得的 v–t 数据；直线斜率表示加速度。',
    })),
    setView: (view: ViewPreset) => commit((state) => ({ ...state, view, focusPart: null })),
    setFocusPart: (focusPart: CartPart) => commit((state) => ({ ...state, view: 'focus', focusPart })),
    setAssembly: (assembly: number) => commit((state) => ({ ...state, assembly: Math.max(0, Math.min(5, assembly)) })),
    selectPoint: (selectedIndex: number) => commit((state) => ({ ...state, selected: selectedIndex })),
    setShowFit: (showFit: boolean) => commit((state) => ({ ...state, showFit })),
    setShowSlopeTriangle: (showSlopeTriangle: boolean) => commit((state) => ({ ...state, showSlopeTriangle })),
    compareAll: () => commit(compareAll),
    clearRuns: () => commit(clearRuns),
    setPreset: (preset: 'uniform' | 'accelerated') => commit((state) => applyPreset(state, preset)),
    assemblyNext: () => commit((state) => assemblyMove(state, 1)),
    assemblyBack: () => commit((state) => assemblyMove(state, -1)),
    reset: () => commit((current) => ({
        ...createCartState(),
        stage: current.stage,
        view: current.view,
        focusPart: current.focusPart,
        hooks: current.hooks,
        v0: current.v0,
        dh: current.dh,
        speed: current.speed,
        skin: current.skin,
        group: current.group,
        runs: current.runs,
        showFit: current.showFit,
        showSlopeTriangle: current.showSlopeTriangle,
        notice: '已回到起点。',
      })),
  }
}

export type CartVelocitySceneState = ReturnType<typeof useCartVelocitySceneState>
