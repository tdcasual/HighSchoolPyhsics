import { Suspense, useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
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
import { safePreload } from './app/safePreload'
import { getRuntimeCapabilities } from './app/runtimeCapabilities'
import { ENHANCED_TOUCH_PROFILE, resolveTouchProfile, resolveTouchTargetMinSize } from './app/touchProfile'

const APP_BRAND_NAME = '教学动画演示'

function isNonBlankText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function resolveRouteButtonLabel(label: unknown, index: number): string {
  return isNonBlankText(label) ? label : `演示 ${index + 1}`
}

function resolveRouteButtonPath(path: unknown): string {
  return isNonBlankText(path) ? path : '/'
}

function App() {
  const theme = useAppStore((state) => state.theme)
  const setTheme = useAppStore((state) => state.setTheme)
  const setActiveScenePath = useAppStore((state) => state.setActiveScenePath)
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
      safePreload(route.preload)
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

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = APP_BRAND_NAME
    }
  }, [])

  useGlobalShortcuts({
    routes: DEMO_ROUTES,
    pathname,
    setTheme,
    navigateTo,
  })

  const isOverviewPage = pathname === '/'
  const activeRoute = useMemo(() => findDemoRoute(pathname), [pathname])
  const activeTouchProfile = resolveTouchProfile(activeRoute?.touchProfile, ENHANCED_TOUCH_PROFILE)
  const ActiveScene = activeRoute?.Component
  const runtimeCapabilities = useMemo(() => getRuntimeCapabilities(), [])
  const shellStyle = useMemo<CSSProperties>(
    () => ({ '--touch-target-min-size': resolveTouchTargetMinSize(activeTouchProfile) } as CSSProperties),
    [activeTouchProfile],
  )
  const shellClassName = [
    'app-shell',
    `theme-${theme}`,
  ]
    .filter(Boolean)
    .join(' ')

  if (!runtimeCapabilities.supported) {
    return (
      <main className="app-shell" data-page-scroll={activeTouchProfile.pageScroll} style={shellStyle}>
        <section className="scene-missing scene-runtime-fallback" role="alert">
          <h1>运行环境不支持</h1>
          <p>当前浏览器不满足 3D 演示运行要求。</p>
          <p>请使用支持以下能力的 Chromium 桌面浏览器：</p>
          <ul>
            {runtimeCapabilities.missing.map((capability) => (
              <li key={capability}>{capability}</li>
            ))}
          </ul>
        </section>
      </main>
    )
  }

  return (
    <main
      className={shellClassName}
      data-page-scroll={activeTouchProfile.pageScroll}
      style={shellStyle}
    >
      <header className="app-header">
        <h1>{APP_BRAND_NAME}</h1>
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
        </div>
      </header>
      <section className="scene-container">
        <Suspense fallback={<div className="scene-loading">加载场景...</div>}>
          {isOverviewPage ? (
            <SceneRuntimeBoundary
              scenePath="/"
              onBackToOverview={() => navigateTo('/')}
            >
              <NavigationPage routes={DEMO_ROUTES} onOpenRoute={navigateTo} />
            </SceneRuntimeBoundary>
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
                {DEMO_ROUTES.map((route, index) => {
                  const routePath = resolveRouteButtonPath(route.path)
                  const routeLabel = resolveRouteButtonLabel(route.label, index)

                  return (
                    <button className="touch-target" key={`${routePath}-${index}`} onClick={() => navigateTo(routePath)}>
                      {routeLabel}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </Suspense>
      </section>
    </main>
  )
}

export default App
