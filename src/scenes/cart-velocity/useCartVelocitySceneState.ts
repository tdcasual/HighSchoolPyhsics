import { useEffect, useRef, useState } from 'react'
import { DURATION } from './model'
import type { ViewPreset } from '../measuring-tools/pose'
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
import type { CartSkin, CartStage } from './pose'

export function useCartVelocitySceneState() {
  const [simulation, setSimulation] = useState(createCartState)
  const simulationRef = useRef(simulation)
  const animating = isAnimating(simulation)

  useEffect(() => {
    simulationRef.current = simulation
  }, [simulation])

  useEffect(() => {
    if (!animating) return
    let frame = 0
    let last = 0
    const loop = (now: number) => {
      const dt = last ? Math.min(0.08, (now - last) / 1000) : 0
      last = now
      const next = advanceCart(simulationRef.current, dt * simulationRef.current.speed)
      simulationRef.current = next
      setSimulation(next)
      if (isAnimating(next)) frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [animating])

  const commit = (updater: (state: CartState) => CartState) => {
    setSimulation((previous) => {
      const next = updater(previous)
      simulationRef.current = next
      return next
    })
  }

  const points = currentPoints(simulation)
  const selected = selectedPoint(simulation)

  return {
    ...simulation,
    animating,
    points,
    selected,
    toggleRunning: () => commit((state) => {
      if (state.stage === 'assemble' && state.assembly < 5) {
        return { ...state, notice: '先把钩码和滑轮装上，再开始运动。' }
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
      running: false,
      time: stage === 'assemble' ? 0 : state.time,
      assembly: stage === 'assemble' ? 0 : state.assembly,
      notice: stage === 'assemble' ? '从长木板开始分步装配。' : stage === 'run' ? '开始实验，或单步看每一个点。' : '这里使用已经打出的点迹。',
    })),
    setView: (view: ViewPreset) => commit((state) => ({ ...state, view })),
    setAssembly: (assembly: number) => commit((state) => ({ ...state, assembly: Math.max(0, Math.min(5, assembly)) })),
    selectPoint: (selectedIndex: number) => commit((state) => ({ ...state, selected: selectedIndex })),
    compareAll: () => commit(compareAll),
    clearRuns: () => commit(clearRuns),
    setPreset: (preset: 'uniform' | 'accelerated') => commit((state) => applyPreset(state, preset)),
    assemblyNext: () => commit((state) => assemblyMove(state, 1)),
    assemblyBack: () => commit((state) => assemblyMove(state, -1)),
    reset: () => {
      const current = simulationRef.current
      const next = {
        ...createCartState(),
        stage: current.stage,
        hooks: current.hooks,
        v0: current.v0,
        dh: current.dh,
        speed: current.speed,
        skin: current.skin,
        group: current.group,
        runs: current.runs,
        notice: '已回到起点。',
      }
      simulationRef.current = next
      setSimulation(next)
    },
  }
}

export type CartVelocitySceneState = ReturnType<typeof useCartVelocitySceneState>
