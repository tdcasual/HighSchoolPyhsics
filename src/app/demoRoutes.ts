import { createElement, type ComponentType } from 'react'
import { SCENE_CATALOG, type ClassroomContract, type DemoRouteMeta, type SceneCatalogEntry } from './sceneCatalog'
import type { TouchProfile } from './touchProfile'
import { createPreloadableScene } from './preloadableScene'
import { DemoPage } from '../pages/DemoPage'

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

type SceneImportModule = {
  default?: unknown
  [exportName: string]: unknown
}

type DemoSceneDefinition = {
  pageId: string
  path: string
  label: string
  meta: DemoRouteMeta
  touchProfile: TouchProfile
  classroom: ClassroomContract
  loadScene: () => Promise<SceneModule>
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

const SCENE_MODULE_LOADERS = import.meta.glob<SceneImportModule>('../scenes/*/*Scene.tsx')

function isSceneComponent(value: unknown): value is ComponentType {
  return typeof value === 'function'
}

function resolveSceneComponent(pageId: string, module: SceneImportModule): ComponentType {
  if (isSceneComponent(module.default)) {
    return module.default
  }

  const namedSceneExports = Object.entries(module).filter(
    (entry): entry is [string, ComponentType] => {
      const [exportName, exportedValue] = entry
      return exportName.endsWith('Scene') && isSceneComponent(exportedValue)
    },
  )

  if (namedSceneExports.length === 1) {
    return namedSceneExports[0][1]
  }

  if (namedSceneExports.length > 1) {
    const exportNames = namedSceneExports.map(([exportName]) => exportName).join(', ')
    throw new Error(`Ambiguous scene exports for pageId "${pageId}": ${exportNames}`)
  }

  throw new Error(`Unable to resolve scene component for pageId "${pageId}"`)
}

function normalizeSceneModulePath(path: string): string | null {
  const matched = path.match(/^\.\.\/scenes\/([a-z][a-z0-9-]*)\/[^/]+Scene\.tsx$/)
  return matched?.[1] ?? null
}

function createSceneLoaders(): Record<string, () => Promise<SceneModule>> {
  const sceneLoaders: Record<string, () => Promise<SceneModule>> = {}

  Object.entries(SCENE_MODULE_LOADERS).forEach(([modulePath, loadModule]) => {
    const pageId = normalizeSceneModulePath(modulePath)
    if (!pageId) {
      return
    }

    if (sceneLoaders[pageId]) {
      throw new Error(`Duplicate scene module discovered for pageId "${pageId}"`)
    }

    sceneLoaders[pageId] = async () => {
      const module = await loadModule()
      return { default: resolveSceneComponent(pageId, module) }
    }
  })

  return sceneLoaders
}

const SCENE_LOADERS = createSceneLoaders()

export const DISCOVERED_SCENE_PAGE_IDS = Object.freeze(Object.keys(SCENE_LOADERS).sort())

export const DEMO_SCENE_CATALOG: SceneCatalogEntry[] = SCENE_CATALOG


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
    touchProfile: entry.touchProfile,
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
    touchProfile: definition.touchProfile,
    classroom: definition.classroom,
  }
})

export function normalizeDemoPath(pathname: unknown): string {
  if (typeof pathname !== 'string') {
    return '/'
  }

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
