import { createElement, type ComponentType } from 'react'
import sceneCatalog from '../../config/demo-scenes.json'
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
  highlights: string[]
  tone: DemoTone
}

type ClassroomContract = {
  presentationSignals: readonly PresentationSignal[]
  coreSummaryLineCount: number
}

type SceneCatalogEntry = {
  pageId: string
  label: string
  meta: DemoRouteMeta
  classroom: ClassroomContract
  playwright: {
    readyText: string
    screenshotName: string
  }
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

const SCENE_LOADERS: Record<string, () => Promise<SceneModule>> = {
  oscilloscope: async () => ({
    default: (await import('../scenes/oscilloscope/OscilloscopeScene')).OscilloscopeScene,
  }),
  cyclotron: async () => ({
    default: (await import('../scenes/cyclotron/CyclotronScene')).CyclotronScene,
  }),
  mhd: async () => ({
    default: (await import('../scenes/mhd/MhdGeneratorScene')).MhdGeneratorScene,
  }),
  oersted: async () => ({
    default: (await import('../scenes/oersted/OerstedScene')).OerstedScene,
  }),
  equipotential: async () => ({
    default: (await import('../scenes/equipotential/EquipotentialScene')).EquipotentialScene,
  }),
  'potential-energy': async () => ({
    default: (await import('../scenes/potential-energy/PotentialEnergyScene')).PotentialEnergyScene,
  }),
  'electrostatic-lab': async () => ({
    default: (await import('../scenes/electrostatic-lab/ElectrostaticLabScene')).ElectrostaticLabScene,
  }),
}

export const DEMO_SCENE_CATALOG: SceneCatalogEntry[] = sceneCatalog as SceneCatalogEntry[]

const DEMO_SCENE_DEFINITIONS: DemoSceneDefinition[] = DEMO_SCENE_CATALOG.map((entry) => {
  const loadScene = SCENE_LOADERS[entry.pageId]
  if (!loadScene) {
    throw new Error(`Missing scene loader for pageId "${entry.pageId}"`)
  }

  return {
    pageId: entry.pageId,
    path: `/${entry.pageId}`,
    label: entry.label,
    meta: entry.meta,
    classroom: entry.classroom,
    loadScene,
  }
})

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
