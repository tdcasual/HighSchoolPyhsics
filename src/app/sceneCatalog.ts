import sceneCatalog from '../../config/demo-scenes.json'
import type { PresentationSignal } from '../ui/layout/presentationSignals'
import type { TouchProfile } from './touchProfile'

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
  touchProfile: TouchProfile
  classroom: ClassroomContract
  playwright: {
    readyText: string
    screenshotName: string
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isNonBlankText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function normalizeScenePath(pathname: unknown): string {
  if (typeof pathname !== 'string') {
    return '/'
  }

  if (!pathname || pathname === '/') {
    return '/'
  }

  const normalized = pathname.replace(/\/+$/, '')
  return normalized.startsWith('/') ? normalized : `/${normalized}`
}

export function buildSceneCatalog(rawCatalog: unknown): SceneCatalogEntry[] {
  if (!Array.isArray(rawCatalog)) {
    throw new Error('sceneCatalog must be an array')
  }

  const seenPageIds = new Set<string>()

  return rawCatalog.map((entry, index) => {
    const fieldName = `sceneCatalog[${index}]`

    if (!isRecord(entry)) {
      throw new Error(`${fieldName} must be an object`)
    }

    if (!isNonBlankText(entry.pageId)) {
      throw new Error(`${fieldName}.pageId must be a non-blank string`)
    }

    if (seenPageIds.has(entry.pageId)) {
      throw new Error(`duplicate sceneCatalog pageId "${entry.pageId}" at index ${index}`)
    }

    seenPageIds.add(entry.pageId)
    return entry as SceneCatalogEntry
  })
}

export const SCENE_CATALOG: SceneCatalogEntry[] = buildSceneCatalog(sceneCatalog)

const SCENE_CATALOG_BY_PATH = new Map(
  SCENE_CATALOG.map((entry) => [`/${entry.pageId}`, entry] satisfies [string, SceneCatalogEntry]),
)

export function findSceneCatalogEntryByPath(pathname: unknown): SceneCatalogEntry | null {
  const normalized = normalizeScenePath(pathname)
  return SCENE_CATALOG_BY_PATH.get(normalized) ?? null
}

export function findRuntimeSceneCatalogEntry(activeScenePath: string): SceneCatalogEntry | null {
  if (typeof window !== 'undefined') {
    return findSceneCatalogEntryByPath(window.location.pathname)
  }

  return findSceneCatalogEntryByPath(activeScenePath)
}

export function resolveClassroomSceneKind(classroom: unknown): SceneKind | null {
  if (!isRecord(classroom)) {
    return null
  }

  switch (classroom.sceneKind) {
    case 'trajectory':
    case 'field':
    case 'structure':
    case 'process':
      return classroom.sceneKind
    default:
      return null
  }
}

export function resolveClassroomSmartPresentation(classroom: unknown): SmartPresentationContract | null {
  if (!isRecord(classroom) || !isRecord(classroom.smartPresentation)) {
    return null
  }

  const smartPresentation = classroom.smartPresentation
  const layout = smartPresentation.layout

  if (layout !== 'never' && layout !== 'enter-only' && layout !== 'staged') {
    return null
  }

  if (typeof smartPresentation.focus !== 'boolean' || typeof smartPresentation.stickySummary !== 'boolean') {
    return null
  }

  return {
    layout,
    focus: smartPresentation.focus,
    stickySummary: smartPresentation.stickySummary,
  }
}

export function canUseRuntimePreferredLayout(smartPresentation: SmartPresentationContract | null | undefined): boolean {
  return smartPresentation?.layout === 'staged'
}

export function resolveSmartFocusEnabled(smartPresentation: SmartPresentationContract | null | undefined): boolean {
  return typeof smartPresentation?.focus === 'boolean' ? smartPresentation.focus : true
}

export function resolveSmartStickySummaryPreference(
  smartPresentation: SmartPresentationContract | null | undefined,
  fallback: boolean,
): boolean {
  return typeof smartPresentation?.stickySummary === 'boolean'
    ? smartPresentation.stickySummary
    : fallback
}

export function resolveSceneKindMinimumAutoSignalScore(sceneKind: SceneKind | null | undefined): number {
  switch (sceneKind) {
    case 'trajectory':
    case 'field':
      return 2
    case 'structure':
    case 'process':
      return 1
    default:
      return 0
  }
}
