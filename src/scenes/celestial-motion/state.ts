import { playbackScale, scenarioOf, type BodyId, type OrbitMode } from './model'

export type CelestialPreset = 'leo' | 'sync' | 'geo' | 'meet' | 'transfer'
export type CelestialView = 'home' | 'equator' | 'pole' | 'custom'

export type CelestialState = {
  mode: OrbitMode
  body: BodyId
  r1: number
  r2: number
  phaseDeg: number
  inclinationDeg: number
  timeScale: number
  time: number
  running: boolean
  finished: boolean
  showVectors: boolean
  showArea: boolean
  showPlane: boolean
  corotate: boolean
  view: CelestialView
  azimuthDeg: number
  elevationDeg: number
  homeAzimuth: number
  homeElevation: number
  notice: string
}

export const PRESETS: Record<
  CelestialPreset,
  {
    mode: OrbitMode
    body: BodyId
    r1: number
    r2: number
    phaseDeg: number
    inclinationDeg: number
    azimuthDeg: number
    elevationDeg: number
    notice: string
  }
> = {
  leo: {
    mode: 'circular',
    body: 'earth',
    r1: 1.1,
    r2: 3,
    phaseDeg: 90,
    inclinationDeg: 30,
    azimuthDeg: -25,
    elevationDeg: 42,
    notice: '近地圆轨道。半径越大，线速度越小，周期越长。',
  },
  sync: {
    mode: 'synchronous',
    body: 'earth',
    r1: 6.62,
    r2: 8,
    phaseDeg: 110,
    inclinationDeg: 30,
    azimuthDeg: 150,
    elevationDeg: 40,
    notice: '同步卫星周期等于恒星日。轨道面离开赤道后，星下点会来回摆动。',
  },
  geo: {
    mode: 'synchronous',
    body: 'earth',
    r1: 6.62,
    r2: 8,
    phaseDeg: 110,
    inclinationDeg: 0,
    azimuthDeg: 155,
    elevationDeg: 38,
    notice: '静止卫星同时满足圆轨道、赤道面、顺行，并且周期等于恒星日。',
  },
  meet: {
    mode: 'rendezvous',
    body: 'earth',
    r1: 1.4,
    r2: 2.2,
    phaseDeg: 100,
    inclinationDeg: 20,
    azimuthDeg: -35,
    elevationDeg: 44,
    notice: '内轨角速度更大。相邻两次同向共线的时间是会合周期。',
  },
  transfer: {
    mode: 'transfer',
    body: 'earth',
    r1: 1.2,
    r2: 4,
    phaseDeg: 0,
    inclinationDeg: 25,
    azimuthDeg: -20,
    elevationDeg: 42,
    notice: '近地点加速进入椭圆，远地点再加速，才能进入更高的圆轨道。',
  },
}

export function minimumOuterOrbitRadius(innerRadius: number) {
  const stepAlignedMinimum = Math.ceil((innerRadius + 0.1 - 1e-9) * 10) / 10
  return Math.max(1.2, stepAlignedMinimum)
}

export function setInnerOrbit(state: CelestialState, r1: number): CelestialState {
  const nextR1 = Math.max(1.05, Math.min(8, r1))
  const needsOuterOrbit = state.mode === 'rendezvous' || state.mode === 'transfer'
  const nextR2 = needsOuterOrbit ? Math.max(state.r2, minimumOuterOrbitRadius(nextR1)) : state.r2
  return {
    ...state,
    r1: nextR1,
    r2: nextR2,
    time: 0,
    running: false,
    finished: false,
    notice: '内轨道半径已更新，动画回到起点。',
  }
}

export function setOuterOrbit(state: CelestialState, r2: number): CelestialState {
  const nextR2 = Math.max(minimumOuterOrbitRadius(state.r1), Math.min(12, r2))
  return {
    ...state,
    r2: nextR2,
    time: 0,
    running: false,
    finished: false,
    notice: '外轨道半径已更新，动画回到起点。',
  }
}

export function createCelestialState(): CelestialState {
  return {
    mode: 'circular',
    body: 'earth',
    r1: 1.1,
    r2: 3,
    phaseDeg: 90,
    inclinationDeg: 0,
    timeScale: 1,
    time: 0,
    running: false,
    finished: false,
    showVectors: true,
    showArea: true,
    showPlane: true,
    corotate: false,
    view: 'home',
    azimuthDeg: -25,
    elevationDeg: 42,
    homeAzimuth: -25,
    homeElevation: 42,
    notice: '圆轨道上，万有引力提供向心力。v = √(GM/r)。',
  }
}

function clamped(state: CelestialState): CelestialState {
  if (state.mode !== 'transfer') return state
  const duration = scenarioOf(state).transT
  if (state.time <= duration) return state
  return { ...state, time: duration, finished: true, running: false }
}

export function integrateCelestial(state: CelestialState, simSeconds: number): CelestialState {
  const scenario = scenarioOf(state)
  let time = state.time + simSeconds
  let running = state.running
  let finished = false
  if (scenario.mode === 'transfer' && time >= scenario.transT) {
    time = scenario.transT
    running = false
    finished = true
  }
  return {
    ...state,
    time,
    running,
    finished,
    notice: finished ? '转移到远地点。第二次点火后进入外圆轨道。' : state.notice,
  }
}

export function stepCelestial(state: CelestialState): CelestialState {
  const chunk = 0.35 * state.timeScale * playbackScale(scenarioOf(state))
  const next = integrateCelestial({ ...state, running: true }, chunk)
  return next.finished ? next : { ...next, running: false, notice: '单步向前。轨道半径、速度和周期都按真实 GM 计算。' }
}

export function toggleCelestial(state: CelestialState): CelestialState {
  if (state.finished) {
    return { ...state, time: 0, finished: false, running: true, notice: '再演示一次。' }
  }
  return {
    ...state,
    running: !state.running,
    notice: state.running ? '已暂停。' : '演示按轨道周期加速，读数仍是真实时间。',
  }
}

export function applyPreset(state: CelestialState, preset: CelestialPreset): CelestialState {
  const next = PRESETS[preset]
  return clamped({
    ...state,
    ...next,
    time: 0,
    running: false,
    finished: false,
    view: 'home',
    homeAzimuth: next.azimuthDeg,
    homeElevation: next.elevationDeg,
    corotate: false,
  })
}

export function setMode(state: CelestialState, mode: OrbitMode): CelestialState {
  const next: CelestialState = {
    ...state,
    mode,
    body: mode === 'synchronous' ? 'earth' : state.body,
    time: 0,
    running: false,
    finished: false,
    notice:
      mode === 'synchronous'
        ? '同步轨道半径由恒星日和地球质量决定，大约 6.62R。'
        : mode === 'transfer'
          ? '霍曼转移只飞半个椭圆，从近地点到远地点。'
          : mode === 'rendezvous'
            ? '两颗卫星各在自己的圆轨道上。内轨追外轨。'
            : '单颗卫星做匀速圆周运动。',
  }
  if (mode === 'rendezvous' || mode === 'transfer') {
    next.r2 = Math.max(next.r2, minimumOuterOrbitRadius(next.r1))
  }
  return clamped(next)
}

export function setBody(state: CelestialState, body: BodyId): CelestialState {
  return {
    ...state,
    body,
    time: 0,
    running: false,
    finished: false,
    notice: `中心天体改为${body === 'moon' ? '月球' : body === 'sun' ? '太阳' : '地球'}。轨道半径仍用它自己的 R 作单位。`,
  }
}

export function setView(state: CelestialState, view: CelestialView): CelestialState {
  if (view === 'equator') return { ...state, view, elevationDeg: 18 }
  if (view === 'pole') return { ...state, view, elevationDeg: 72 }
  if (view === 'custom') return { ...state, view }
  return { ...state, view: 'home', azimuthDeg: state.homeAzimuth, elevationDeg: state.homeElevation }
}
