import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Suspense, createElement } from 'react'
import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import sceneCatalog from '../../../config/demo-scenes.json'
import { DEMO_ROUTES, DISCOVERED_SCENE_PAGE_IDS } from '../demoRoutes'
import { findSceneCatalogEntryByPath } from '../sceneCatalog'
import { scorePresentationSignals } from '../../ui/layout/presentationSignals'
import { collectRouteConformanceIssues } from '../routeConformance'
import { useAppStore } from '../../store/useAppStore'

function setViewportSize(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  })
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    writable: true,
    value: height,
  })
  window.dispatchEvent(new Event('resize'))
}

function countRenderedCoreSummaryLines(summary: HTMLElement): number {
  const summaryLines = summary.querySelectorAll('.scene-core-summary-stack > p')
  if (summaryLines.length > 0) {
    return summaryLines.length
  }

  return summary.querySelectorAll('p').length
}

function readSceneDeclaredPresentationSignals(pageId: string): string[] {
  const sceneDirectory = resolve(process.cwd(), 'src/scenes', pageId)
  const sceneFiles = readdirSync(sceneDirectory).filter((fileName) => fileName.endsWith('Scene.tsx'))

  if (sceneFiles.length !== 1) {
    throw new Error(`Expected exactly one scene shell for ${pageId}, found ${sceneFiles.length}`)
  }

  const sceneSource = readFileSync(resolve(sceneDirectory, sceneFiles[0]), 'utf8')
  const presentationSignalsMatch = sceneSource.match(/presentationSignals=\{\[([^\]]*)\]\}/s)
  if (!presentationSignalsMatch) {
    throw new Error(`Missing SceneLayout presentationSignals declaration for ${pageId}`)
  }

  return presentationSignalsMatch[1]
    .split(',')
    .map((token) => token.trim().replace(/^['"]|['"]$/g, ''))
    .filter((token) => token.length > 0)
}

function collectRenderedPresentationSignals(host: ParentNode = document.body): string[] {
  const signals = new Set<string>()

  host.querySelectorAll<HTMLElement>('[data-presentation-signal]').forEach((node) => {
    node
      .getAttribute('data-presentation-signal')
      ?.split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 0)
      .forEach((token) => signals.add(token))
  })

  return [...signals].sort()
}

async function renderDemoRoute(route: (typeof DEMO_ROUTES)[number]) {
  window.history.replaceState(null, '', route.path)
  useAppStore.setState({
    presentationMode: true,
    presentationRouteModes: { [route.path]: 'viewport' },
    activeScenePath: route.path,
  })

  await route.preload()

  return render(
    createElement(
      Suspense,
      { fallback: createElement('p', null, 'loading') },
      createElement(route.Component),
    ),
  )
}

describe('demo route conformance', () => {
  beforeEach(() => {
    setViewportSize(1920, 1080)
  })

  afterEach(() => {
    window.history.replaceState(null, '', '/')
    useAppStore.setState({
      presentationMode: false,
      presentationRouteModes: {},
      activeScenePath: '/',
    })
  })

  it('enforces complete navigation and touch profile metadata for every demo route', () => {
    expect(collectRouteConformanceIssues(DEMO_ROUTES)).toEqual([])
  })

  it('declares the enhanced touch gesture package with minimum 44px target', () => {
    for (const route of DEMO_ROUTES) {
      expect(route.touchProfile.pageScroll).toBe('vertical-outside-canvas')
      expect(route.touchProfile.minTouchTargetPx).toBeGreaterThanOrEqual(44)
      expect(route.touchProfile.gestureMatrix.singleFingerRotate).toBe(true)
      expect(route.touchProfile.gestureMatrix.twoFingerZoom).toBe(true)
      expect(route.touchProfile.gestureMatrix.twoFingerPan).toBe(true)
    }
  })

  it('declares classroom contract for every route with teach-critical fallback size', () => {
    for (const route of DEMO_ROUTES) {
      expect(route.pageId).toMatch(/^[a-z][a-z0-9-]*$/)
      expect(route.path).toBe(`/${route.pageId}`)
      expect(route.classroom.presentationSignals.length).toBeGreaterThan(0)
      expect(scorePresentationSignals(route.classroom.presentationSignals)).toBeGreaterThanOrEqual(1)
      expect(route.classroom.coreSummaryLineCount).toBeGreaterThanOrEqual(3)
      expect(route.classroom.coreSummaryLineCount).toBeLessThanOrEqual(5)
      expect(route.classroom.sceneKind).toMatch(/^(trajectory|field|structure|process)$/)
      expect(route.classroom.smartPresentation.layout).toMatch(/^(never|enter-only|staged)$/)
      expect(typeof route.classroom.smartPresentation.focus).toBe('boolean')
      expect(typeof route.classroom.smartPresentation.stickySummary).toBe('boolean')
    }
  })

  it('keeps SceneLayout presentationSignals declarations aligned with the catalog', () => {
    for (const route of DEMO_ROUTES) {
      expect(readSceneDeclaredPresentationSignals(route.pageId)).toEqual(route.classroom.presentationSignals)
    }
  })

  it('matches each catalog core summary line count to the rendered classroom summary', async () => {
    for (const route of DEMO_ROUTES) {
      const { unmount } = await renderDemoRoute(route)

      const summary = await screen.findByRole('region', { name: '课堂核心信息' })
      expect(
        countRenderedCoreSummaryLines(summary),
        `${route.pageId} rendered coreSummary should match catalog line count`,
      ).toBe(route.classroom.coreSummaryLineCount)

      unmount()
    }
  })

  it('keeps rendered DOM presentation signals aligned with each classroom contract', async () => {
    for (const route of DEMO_ROUTES) {
      const { unmount, container } = await renderDemoRoute(route)
      await screen.findByRole('region', { name: '课堂核心信息' })

      const renderedSignals = collectRenderedPresentationSignals(container)
      const declaredSignals = [...route.classroom.presentationSignals].sort()

      expect(
        renderedSignals,
        `${route.pageId} rendered data-presentation-signal tokens should match the classroom contract`,
      ).toEqual(declaredSignals)

      unmount()
    }
  })

  it('keeps route touch profiles aligned with the shared catalog source', () => {
    for (const route of DEMO_ROUTES) {
      const catalogEntry = findSceneCatalogEntryByPath(route.path)

      expect(route.touchProfile).toEqual(catalogEntry?.touchProfile)
    }
  })

  it('stays aligned with the shared scene catalog source', () => {
    const expectedPageIds = sceneCatalog.map((scene) => scene.pageId)
    expect(DEMO_ROUTES.map((route) => route.pageId)).toEqual(expectedPageIds)
    expect(DEMO_ROUTES.map((route) => route.path)).toEqual(
      expectedPageIds.map((pageId) => `/${pageId}`),
    )
  })

  it('exposes shared classroom contract lookup by normalized route path', () => {
    const potential = findSceneCatalogEntryByPath('/potential-energy/')
    expect(potential?.classroom.smartPresentation.layout).toBe('staged')
    expect(potential?.classroom.smartPresentation.focus).toBe(true)

    const oscilloscope = findSceneCatalogEntryByPath('/oscilloscope')
    expect(oscilloscope?.classroom.smartPresentation.stickySummary).toBe(false)
  })

  it('keeps auto-discovered scene modules aligned with the catalog', () => {
    const expectedPageIds = sceneCatalog.map((scene) => scene.pageId).sort()
    expect(DISCOVERED_SCENE_PAGE_IDS).toEqual(expectedPageIds)
  })
})
