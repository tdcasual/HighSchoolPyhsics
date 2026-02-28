import { createElement, type ComponentType } from 'react'
import { createPreloadableScene } from './preloadableScene'
import { DemoPage } from '../pages/DemoPage'
import type { PresentationSignal } from '../ui/layout/presentationSignals'

type TouchGestureMatrix = {
  singleFingerRotate: boolean
  twoFingerZoom: boolean
  twoFingerPan: boolean
  doubleTapReset: boolean
  threeFingerModeSwitch: boolean
}

type TouchProfile = {
  pageScroll: 'vertical-outside-canvas'
  canvasGestureScope: 'interactive-canvas'
  minTouchTargetPx: number
  gestureMatrix: TouchGestureMatrix
}

type DemoTone = 'scope' | 'cyclotron' | 'mhd' | 'oersted'

type DemoRouteMeta = {
  tag: string
  summary: string
  highlights: [string, string]
  tone: DemoTone
}

type ClassroomContract = {
  presentationSignals: readonly PresentationSignal[]
  coreSummaryLineCount: number
}

export type DemoRoute = {
  pageId: string
  path: string
  label: string
  Component: ComponentType
  preload: () => Promise<void>
  meta: DemoRouteMeta
  touchProfile: TouchProfile
  classroom: ClassroomContract
}

type SceneModule = {
  default: ComponentType
}

type DemoSceneDefinition = {
  pageId: string
  path: string
  label: string
  meta: DemoRouteMeta
  classroom: ClassroomContract
  loadScene: () => Promise<SceneModule>
}

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

function createWrappedScene(definition: DemoSceneDefinition) {
  return createPreloadableScene(async () => {
    const mod = await definition.loadScene()
    const SceneComponent = mod.default
    const WrappedScene: ComponentType = () =>
      createElement(DemoPage, { pageId: definition.pageId }, createElement(SceneComponent))
    return { default: WrappedScene }
  })
}

const DEMO_SCENE_DEFINITIONS: DemoSceneDefinition[] = [
  {
    pageId: 'oscilloscope',
    path: '/oscilloscope',
    label: '示波器',
    meta: {
      tag: '波形合成',
      summary: '双通道电压驱动 + 李萨如图形',
      highlights: ['函数编辑与预设切换', '荧光屏轨迹实时更新'],
      tone: 'scope',
    },
    classroom: {
      presentationSignals: ['chart', 'live-metric'],
      coreSummaryLineCount: 3,
    },
    loadScene: async () => ({
      default: (await import('../scenes/oscilloscope/OscilloscopeScene')).OscilloscopeScene,
    }),
  },
  {
    pageId: 'cyclotron',
    path: '/cyclotron',
    label: '回旋加速器',
    meta: {
      tag: '粒子动力学',
      summary: '交变电场加速 + 磁场轨道约束',
      highlights: ['U-t / Ek-t 双曲线', '可切换加速时间模型'],
      tone: 'cyclotron',
    },
    classroom: {
      presentationSignals: ['chart', 'time-series', 'live-metric'],
      coreSummaryLineCount: 4,
    },
    loadScene: async () => ({
      default: (await import('../scenes/cyclotron/CyclotronScene')).CyclotronScene,
    }),
  },
  {
    pageId: 'mhd',
    path: '/mhd',
    label: '磁流体发电机',
    meta: {
      tag: '能量转换',
      summary: '等离子体通道中的感应电势演示',
      highlights: ['磁场/流速/导电率联动', '端电压实时读数'],
      tone: 'mhd',
    },
    classroom: {
      presentationSignals: ['live-metric'],
      coreSummaryLineCount: 3,
    },
    loadScene: async () => ({
      default: (await import('../scenes/mhd/MhdGeneratorScene')).MhdGeneratorScene,
    }),
  },
  {
    pageId: 'oersted',
    path: '/oersted',
    label: '奥斯特实验',
    meta: {
      tag: '课堂观察',
      summary: '三磁针偏转与导线姿态联动',
      highlights: ['拖拽磁针自由摆位', '磁感线可显隐对比'],
      tone: 'oersted',
    },
    classroom: {
      presentationSignals: ['interactive-readout'],
      coreSummaryLineCount: 4,
    },
    loadScene: async () => ({
      default: (await import('../scenes/oersted/OerstedScene')).OerstedScene,
    }),
  },
]

export const DEMO_ROUTES: DemoRoute[] = DEMO_SCENE_DEFINITIONS.map((definition) => {
  const preloadable = createWrappedScene(definition)

  return {
    pageId: definition.pageId,
    path: definition.path,
    label: definition.label,
    Component: preloadable.Component,
    preload: preloadable.preload,
    meta: definition.meta,
    touchProfile: ENHANCED_TOUCH_PROFILE,
    classroom: definition.classroom,
  }
})

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
