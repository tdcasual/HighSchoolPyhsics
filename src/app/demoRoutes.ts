import type { ComponentType } from 'react'
import { createPreloadableScene } from './preloadableScene'

export type TouchGestureMatrix = {
  singleFingerRotate: boolean
  twoFingerZoom: boolean
  twoFingerPan: boolean
  doubleTapReset: boolean
  threeFingerModeSwitch: boolean
}

export type TouchProfile = {
  pageScroll: 'vertical-outside-canvas'
  canvasGestureScope: 'interactive-canvas'
  minTouchTargetPx: number
  gestureMatrix: TouchGestureMatrix
}

export type DemoTone = 'scope' | 'cyclotron' | 'mhd' | 'oersted'

export type DemoRouteMeta = {
  tag: string
  summary: string
  highlights: [string, string]
  tone: DemoTone
}

export type DemoRoute = {
  path: string
  label: string
  Component: ComponentType
  preload: () => Promise<void>
  meta: DemoRouteMeta
  touchProfile: TouchProfile
}

const OscilloscopeScene = createPreloadableScene(async () => {
  const mod = await import('../pages/OscilloscopePage')
  return { default: mod.OscilloscopePage }
})

const CyclotronScene = createPreloadableScene(async () => {
  const mod = await import('../pages/CyclotronPage')
  return { default: mod.CyclotronPage }
})

const MhdGeneratorScene = createPreloadableScene(async () => {
  const mod = await import('../pages/MhdPage')
  return { default: mod.MhdPage }
})

const OerstedScene = createPreloadableScene(async () => {
  const mod = await import('../pages/OerstedPage')
  return { default: mod.OerstedPage }
})

const ENHANCED_TOUCH_PROFILE: TouchProfile = {
  pageScroll: 'vertical-outside-canvas',
  canvasGestureScope: 'interactive-canvas',
  minTouchTargetPx: 44,
  gestureMatrix: {
    singleFingerRotate: true,
    twoFingerZoom: true,
    twoFingerPan: true,
    doubleTapReset: true,
    threeFingerModeSwitch: true,
  },
}

export const DEMO_ROUTES: DemoRoute[] = [
  {
    path: '/oscilloscope',
    label: '示波器',
    Component: OscilloscopeScene.Component,
    preload: OscilloscopeScene.preload,
    meta: {
      tag: '波形合成',
      summary: '双通道电压驱动 + 李萨如图形',
      highlights: ['函数编辑与预设切换', '荧光屏轨迹实时更新'],
      tone: 'scope',
    },
    touchProfile: ENHANCED_TOUCH_PROFILE,
  },
  {
    path: '/cyclotron',
    label: '回旋加速器',
    Component: CyclotronScene.Component,
    preload: CyclotronScene.preload,
    meta: {
      tag: '粒子动力学',
      summary: '交变电场加速 + 磁场轨道约束',
      highlights: ['U-t / Ek-t 双曲线', '可切换加速时间模型'],
      tone: 'cyclotron',
    },
    touchProfile: ENHANCED_TOUCH_PROFILE,
  },
  {
    path: '/mhd',
    label: '磁流体发电机',
    Component: MhdGeneratorScene.Component,
    preload: MhdGeneratorScene.preload,
    meta: {
      tag: '能量转换',
      summary: '等离子体通道中的感应电势演示',
      highlights: ['磁场/流速/导电率联动', '端电压实时读数'],
      tone: 'mhd',
    },
    touchProfile: ENHANCED_TOUCH_PROFILE,
  },
  {
    path: '/oersted',
    label: '奥斯特实验',
    Component: OerstedScene.Component,
    preload: OerstedScene.preload,
    meta: {
      tag: '课堂观察',
      summary: '三磁针偏转与导线姿态联动',
      highlights: ['拖拽磁针自由摆位', '磁感线可显隐对比'],
      tone: 'oersted',
    },
    touchProfile: ENHANCED_TOUCH_PROFILE,
  },
]

export function normalizeDemoPath(pathname: string): string {
  if (!pathname || pathname === '/') {
    return '/'
  }

  const normalized = pathname.replace(/\/+$/, '')
  return normalized.startsWith('/') ? normalized : `/${normalized}`
}

export function findDemoRoute(pathname: string): DemoRoute | null {
  const normalized = normalizeDemoPath(pathname)
  return DEMO_ROUTES.find((route) => route.path === normalized) ?? null
}
