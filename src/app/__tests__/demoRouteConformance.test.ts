import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Suspense, createElement } from 'react'
import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import * as ts from 'typescript'
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

function unwrapPresentationSignalsExpression(expression: ts.Expression): ts.Expression {
  if (ts.isParenthesizedExpression(expression) || ts.isAsExpression(expression) || ts.isTypeAssertionExpression(expression) || ts.isSatisfiesExpression(expression)) {
    return unwrapPresentationSignalsExpression(expression.expression)
  }

  return expression
}

function readSignalsFromArrayLiteral(arrayLiteral: ts.ArrayLiteralExpression, contextLabel: string): string[] {
  return arrayLiteral.elements.map((element, index) => {
    const resolvedElement = unwrapPresentationSignalsExpression(element)
    if (!ts.isStringLiteralLike(resolvedElement)) {
      throw new Error(`presentationSignals[${index}] must be a string literal in ${contextLabel}`)
    }
    return resolvedElement.text
  })
}

function findPresentationSignalsExpression(sourceFile: ts.SourceFile): ts.Expression | null {
  let foundExpression: ts.Expression | null = null

  const visit = (node: ts.Node) => {
    if (foundExpression) {
      return
    }

    if (ts.isJsxAttribute(node) && ts.isIdentifier(node.name) && node.name.text === 'presentationSignals') {
      const initializer = node.initializer
      if (initializer && ts.isJsxExpression(initializer) && initializer.expression) {
        foundExpression = initializer.expression
        return
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return foundExpression
}

function findConstInitializer(sourceFile: ts.SourceFile, identifierName: string): ts.Expression | null {
  let initializer: ts.Expression | null = null

  const visit = (node: ts.Node) => {
    if (initializer) {
      return
    }

    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === identifierName) {
      initializer = node.initializer ?? null
      return
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return initializer
}

function resolvePresentationSignalsExpression(
  expression: ts.Expression,
  sourceFile: ts.SourceFile,
  contextLabel: string,
  seenIdentifiers: Set<string> = new Set(),
): string[] {
  const resolvedExpression = unwrapPresentationSignalsExpression(expression)

  if (ts.isArrayLiteralExpression(resolvedExpression)) {
    return readSignalsFromArrayLiteral(resolvedExpression, contextLabel)
  }

  if (ts.isIdentifier(resolvedExpression)) {
    if (seenIdentifiers.has(resolvedExpression.text)) {
      throw new Error(`Recursive presentationSignals reference detected for ${contextLabel}`)
    }
    seenIdentifiers.add(resolvedExpression.text)

    const initializer = findConstInitializer(sourceFile, resolvedExpression.text)
    if (!initializer) {
      throw new Error(`Unable to resolve presentationSignals reference "${resolvedExpression.text}" for ${contextLabel}`)
    }

    return resolvePresentationSignalsExpression(initializer, sourceFile, contextLabel, seenIdentifiers)
  }

  throw new Error(`Unsupported SceneLayout presentationSignals declaration for ${contextLabel}`)
}

function readPresentationSignalsFromSceneSource(sceneSource: string, contextLabel: string): string[] {
  const sourceFile = ts.createSourceFile(
    `${contextLabel}.tsx`,
    sceneSource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  const presentationSignalsExpression = findPresentationSignalsExpression(sourceFile)

  if (!presentationSignalsExpression) {
    throw new Error(`Missing SceneLayout presentationSignals declaration for ${contextLabel}`)
  }

  return resolvePresentationSignalsExpression(presentationSignalsExpression, sourceFile, contextLabel)
}

function readSceneDeclaredPresentationSignals(pageId: string): string[] {
  const sceneDirectory = resolve(process.cwd(), 'src/scenes', pageId)
  const sceneFiles = readdirSync(sceneDirectory).filter((fileName) => fileName.endsWith('Scene.tsx'))

  if (sceneFiles.length !== 1) {
    throw new Error(`Expected exactly one scene shell for ${pageId}, found ${sceneFiles.length}`)
  }

  const sceneSource = readFileSync(resolve(sceneDirectory, sceneFiles[0]), 'utf8')
  return readPresentationSignalsFromSceneSource(sceneSource, pageId)
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
  it('reads SceneLayout presentationSignals from referenced const arrays', () => {
    const source = `const presentationSignals = ['chart', 'live-metric'] as const

export function SampleScene() {
  return (
    <SceneLayout
      presentationSignals={presentationSignals}
      coreSummary={<div />}
      controls={<div />}
      viewport={<div />}
    />
  )
}`

    expect(readPresentationSignalsFromSceneSource(source, 'sample-scene')).toEqual(['chart', 'live-metric'])
  })

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

  it('rejects unsupported classroom presentation signals in route metadata', () => {
    const invalidRoute = {
      ...DEMO_ROUTES[0],
      classroom: {
        ...DEMO_ROUTES[0].classroom,
        presentationSignals: ['live-mteric'] as unknown as (typeof DEMO_ROUTES)[number]['classroom']['presentationSignals'],
      },
    }

    expect(collectRouteConformanceIssues([invalidRoute])).toContainEqual({
      path: invalidRoute.path,
      message: 'classroom.presentationSignals[0] must be one of chart|live-metric|time-series|interactive-readout',
    })
  })

  it('reports non-string route metadata as conformance issues instead of throwing', () => {
    const invalidRoute = {
      ...DEMO_ROUTES[0],
      label: 42 as unknown as (typeof DEMO_ROUTES)[number]['label'],
      meta: {
        ...DEMO_ROUTES[0].meta,
        tag: false as unknown as (typeof DEMO_ROUTES)[number]['meta']['tag'],
        summary: { text: 'bad' } as unknown as (typeof DEMO_ROUTES)[number]['meta']['summary'],
        highlights: [42, 'ok'] as unknown as (typeof DEMO_ROUTES)[number]['meta']['highlights'],
        tone: false as unknown as (typeof DEMO_ROUTES)[number]['meta']['tone'],
      },
    }

    expect(collectRouteConformanceIssues([invalidRoute])).toEqual(
      expect.arrayContaining([
        {
          path: invalidRoute.path,
          message: 'label must be a non-blank string',
        },
        {
          path: invalidRoute.path,
          message: 'meta.tag must be a non-blank string',
        },
        {
          path: invalidRoute.path,
          message: 'meta.summary must be a non-blank string',
        },
        {
          path: invalidRoute.path,
          message: 'meta.highlights[0] must be a non-blank string',
        },
        {
          path: invalidRoute.path,
          message: 'meta.tone must be one of scope|cyclotron|mhd|oersted',
        },
      ]),
    )
  })

  it('reports missing route meta objects as conformance issues instead of throwing', () => {
    const invalidRoute = {
      ...DEMO_ROUTES[0],
      meta: null as unknown as (typeof DEMO_ROUTES)[number]['meta'],
    }

    expect(collectRouteConformanceIssues([invalidRoute])).toContainEqual({
      path: invalidRoute.path,
      message: 'meta must be an object with tag, summary, highlights, and tone',
    })
  })

  it('reports malformed classroom metadata as conformance issues instead of throwing', () => {
    const invalidRoute = {
      ...DEMO_ROUTES[0],
      classroom: {
        ...DEMO_ROUTES[0].classroom,
        presentationSignals: 'chart' as unknown as (typeof DEMO_ROUTES)[number]['classroom']['presentationSignals'],
        coreSummaryLineCount: '4' as unknown as (typeof DEMO_ROUTES)[number]['classroom']['coreSummaryLineCount'],
        smartPresentation: null as unknown as (typeof DEMO_ROUTES)[number]['classroom']['smartPresentation'],
      },
    }

    expect(collectRouteConformanceIssues([invalidRoute])).toEqual(
      expect.arrayContaining([
        {
          path: invalidRoute.path,
          message: 'classroom.presentationSignals must be an array of supported signals',
        },
        {
          path: invalidRoute.path,
          message: 'classroom.coreSummaryLineCount must be an integer between 3 and 5',
        },
        {
          path: invalidRoute.path,
          message: 'classroom.smartPresentation must be an object with layout, focus, and stickySummary',
        },
      ]),
    )
  })

  it('reports malformed touch metadata as conformance issues instead of throwing', () => {
    const invalidRoute = {
      ...DEMO_ROUTES[0],
      touchProfile: {
        ...DEMO_ROUTES[0].touchProfile,
        pageScroll: false as unknown as (typeof DEMO_ROUTES)[number]['touchProfile']['pageScroll'],
        canvasGestureScope: 12 as unknown as (typeof DEMO_ROUTES)[number]['touchProfile']['canvasGestureScope'],
        minTouchTargetPx: '44' as unknown as (typeof DEMO_ROUTES)[number]['touchProfile']['minTouchTargetPx'],
        gestureMatrix: null as unknown as (typeof DEMO_ROUTES)[number]['touchProfile']['gestureMatrix'],
      },
    }

    expect(collectRouteConformanceIssues([invalidRoute])).toEqual(
      expect.arrayContaining([
        {
          path: invalidRoute.path,
          message: 'touchProfile.pageScroll must be vertical-outside-canvas',
        },
        {
          path: invalidRoute.path,
          message: 'touchProfile.canvasGestureScope must be interactive-canvas',
        },
        {
          path: invalidRoute.path,
          message: 'touchProfile.minTouchTargetPx must be a number >= 44',
        },
        {
          path: invalidRoute.path,
          message: 'touchProfile.gestureMatrix must be an object with singleFingerRotate, twoFingerZoom, and twoFingerPan',
        },
      ]),
    )
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
