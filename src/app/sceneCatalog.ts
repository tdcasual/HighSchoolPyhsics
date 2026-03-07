import sceneCatalog from '../../config/demo-scenes.json'
import type { PresentationSignal } from '../ui/layout/presentationSignals'

export type DemoTone = 'scope' | 'cyclotron' | 'mhd' | 'oersted'

export type DemoRouteMeta = {
  tag: string
  summary: string
  highlights: string[]
  tone: DemoTone
}

export type SceneKind = 'trajectory' | 'field' | 'structure' | 'process'

export type SmartPresentationContract = {
  layout: 'never' | 'enter-only' | 'staged'
  focus: boolean
  stickySummary: boolean
}

export type ClassroomContract = {
  presentationSignals: readonly PresentationSignal[]
  coreSummaryLineCount: number
  sceneKind: SceneKind
  smartPresentation: SmartPresentationContract
}

export type SceneCatalogEntry = {
  pageId: string
  label: string
  meta: DemoRouteMeta
  classroom: ClassroomContract
  playwright: {
    readyText: string
    screenshotName: string
  }
}

function normalizeScenePath(pathname: string): string {
  if (!pathname || pathname === '/') {
    return '/'
  }

  const normalized = pathname.replace(/\/+$/, '')
  return normalized.startsWith('/') ? normalized : `/${normalized}`
}

export const SCENE_CATALOG: SceneCatalogEntry[] = sceneCatalog as SceneCatalogEntry[]

const SCENE_CATALOG_BY_PATH = new Map(
  SCENE_CATALOG.map((entry) => [`/${entry.pageId}`, entry] satisfies [string, SceneCatalogEntry]),
)

export function findSceneCatalogEntryByPath(pathname: string): SceneCatalogEntry | null {
  const normalized = normalizeScenePath(pathname)
  return SCENE_CATALOG_BY_PATH.get(normalized) ?? null
}

export function findRuntimeSceneCatalogEntry(activeScenePath: string): SceneCatalogEntry | null {
  if (typeof window !== 'undefined') {
    return findSceneCatalogEntryByPath(window.location.pathname)
  }

  return findSceneCatalogEntryByPath(activeScenePath)
}

export function canUseRuntimePreferredLayout(smartPresentation: SmartPresentationContract | null | undefined): boolean {
  return smartPresentation?.layout === 'staged'
}

export function resolveSmartFocusEnabled(smartPresentation: SmartPresentationContract | null | undefined): boolean {
  return smartPresentation?.focus ?? true
}

export function resolveSmartStickySummaryPreference(
  smartPresentation: SmartPresentationContract | null | undefined,
  fallback: boolean,
): boolean {
  return smartPresentation?.stickySummary ?? fallback
}
