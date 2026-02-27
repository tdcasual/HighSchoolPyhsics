import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import {
  DEMO_ROUTES,
  findDemoRoute,
  normalizeDemoPath,
} from './app/demoRoutes'
import { SceneRuntimeBoundary } from './app/SceneRuntimeBoundary'
import { NavigationPage } from './pages/NavigationPage'
import { useAppStore } from './store/useAppStore'
import { useGlobalShortcuts } from './app/useGlobalShortcuts'

const PRESENTATION_LAYOUT_OPTIONS = [
  { value: 'auto', label: '自动' },
  { value: 'split', label: '双核心' },
  { value: 'viewport', label: '视口优先' },
] as const

function App() {
  const theme = useAppStore((state) => state.theme)
  const nightTone = useAppStore((state) => state.nightTone)
  const presentationMode = useAppStore((state) => state.presentationMode)
  const presentationRouteModes = useAppStore((state) => state.presentationRouteModes)
  const setTheme = useAppStore((state) => state.setTheme)
  const setNightTone = useAppStore((state) => state.setNightTone)
  const setPresentationMode = useAppStore((state) => state.setPresentationMode)
  const setActiveScenePath = useAppStore((state) => state.setActiveScenePath)
  const setPresentationRouteMode = useAppStore((state) => state.setPresentationRouteMode)
  const [pathname, setPathname] = useState(() => {
    if (typeof window === 'undefined') {
      return '/'
    }

    return normalizeDemoPath(window.location.pathname)
  })

  const navigateTo = useCallback((nextPath: string, replace = false) => {
    if (typeof window === 'undefined') {
      return
    }

    const targetPath = normalizeDemoPath(nextPath)
    const current = normalizeDemoPath(window.location.pathname)
    if (targetPath === current) {
      return
    }

    const route = findDemoRoute(targetPath)
    if (route) {
      void route.preload()
    }

    if (replace) {
      window.history.replaceState(null, '', targetPath)
    } else {
      window.history.pushState(null, '', targetPath)
    }
    setPathname(targetPath)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const onPopState = () => {
      setPathname(normalizeDemoPath(window.location.pathname))
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    setActiveScenePath(pathname)
  }, [pathname, setActiveScenePath])

  useGlobalShortcuts({
    routes: DEMO_ROUTES,
    pathname,
    theme,
    presentationMode,
    setTheme,
    setNightTone,
    setPresentationMode,
    navigateTo,
  })

  const isOverviewPage = pathname === '/'
  const presentationLayoutMode = presentationRouteModes[pathname] ?? 'auto'
  const presentationLayoutLabel =
    PRESENTATION_LAYOUT_OPTIONS.find((option) => option.value === presentationLayoutMode)?.label ?? '自动'
  const canConfigurePresentationLayout = presentationMode && !isOverviewPage
  const activeRoute = useMemo(() => findDemoRoute(pathname), [pathname])
  const ActiveScene = activeRoute?.Component
  const shellClassName = [
    'app-shell',
    `theme-${theme}`,
    presentationMode ? 'presentation-mode' : '',
    theme === 'night' ? `night-tone-${nightTone}` : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <main className={shellClassName}>
      <header className="app-header">
        <h1>3D Electromagnetics Lab</h1>
        <div className="app-controls">
          {!isOverviewPage ? (
            <button className="overview-link touch-target" onClick={() => navigateTo('/')}>
              返回导航
            </button>
          ) : null}
          <div className="theme-switch">
            <button
              className={`touch-target ${theme === 'day' ? 'active' : ''}`.trim()}
              aria-pressed={theme === 'day'}
              aria-keyshortcuts="D"
              title="快捷键 D"
              onClick={() => setTheme('day')}
            >
              白天模式
            </button>
            <button
              className={`touch-target ${theme === 'night' ? 'active' : ''}`.trim()}
              aria-pressed={theme === 'night'}
              aria-keyshortcuts="N"
              title="快捷键 N"
              onClick={() => setTheme('night')}
            >
              夜间模式
            </button>
          </div>
          {theme === 'night' ? (
            <div className="night-tone-switch" role="group" aria-label="夜间风格">
              <button
                className={`touch-target ${nightTone === 'minimal' ? 'active' : ''}`.trim()}
                aria-pressed={nightTone === 'minimal'}
                aria-keyshortcuts="M"
                title="快捷键 M"
                onClick={() => setNightTone('minimal')}
              >
                夜间极简
              </button>
              <button
                className={`touch-target ${nightTone === 'neon' ? 'active' : ''}`.trim()}
                aria-pressed={nightTone === 'neon'}
                aria-keyshortcuts="E"
                title="快捷键 E"
                onClick={() => setNightTone('neon')}
              >
                夜间霓虹
              </button>
            </div>
          ) : null}
          <button
            className={`touch-target presentation-toggle ${presentationMode ? 'active' : ''}`.trim()}
            aria-pressed={presentationMode}
            aria-keyshortcuts="P"
            title="快捷键 P"
            onClick={() => setPresentationMode(!presentationMode)}
          >
            课堂展示
          </button>
          {presentationMode ? (
            <p className="presentation-indicator" aria-live="polite">
              课堂展示中 · {presentationLayoutLabel}
            </p>
          ) : null}
          {canConfigurePresentationLayout ? (
            <div className="presentation-layout-switch" role="group" aria-label="课堂展示布局">
              {PRESENTATION_LAYOUT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  className={`touch-target ${presentationLayoutMode === option.value ? 'active' : ''}`.trim()}
                  aria-pressed={presentationLayoutMode === option.value}
                  onClick={() => setPresentationRouteMode(pathname, option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </header>
      <section className="scene-container">
        <Suspense fallback={<div className="scene-loading">加载场景...</div>}>
          {isOverviewPage ? (
            <NavigationPage routes={DEMO_ROUTES} onOpenRoute={navigateTo} />
          ) : ActiveScene ? (
            <SceneRuntimeBoundary
              scenePath={pathname}
              onBackToOverview={() => navigateTo('/')}
              onRetryScene={() => activeRoute?.preload()}
            >
              <ActiveScene />
            </SceneRuntimeBoundary>
          ) : (
            <div className="scene-missing">
              <h2>页面不存在</h2>
              <p>请选择一个有效演示页面，或先返回导航：</p>
              <div className="scene-missing-links">
                <button className="touch-target" onClick={() => navigateTo('/')}>
                  返回导航
                </button>
                {DEMO_ROUTES.map((route) => (
                  <button className="touch-target" key={route.path} onClick={() => navigateTo(route.path)}>
                    {route.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Suspense>
      </section>
    </main>
  )
}

export default App
