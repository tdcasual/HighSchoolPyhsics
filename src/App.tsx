import { Suspense, useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
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
import { useMediaQuery, MOBILE_BREAKPOINT } from './ui/hooks/useMediaQuery'
import { ShortcutHelpOverlay } from './ui/overlays/ShortcutHelpOverlay'

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
  const largeText = useAppStore((state) => state.largeText)
  const setLargeText = useAppStore((state) => state.setLargeText)
  const presenting = useAppStore((state) => state.presenting)
  const setPresenting = useAppStore((state) => state.setPresenting)
  const predicting = useAppStore((state) => state.predicting)
  const setPredicting = useAppStore((state) => state.setPredicting)
  const setActiveScenePath = useAppStore((state) => state.setActiveScenePath)
  const mobilePlaybackActions = useAppStore((state) => state.mobilePlaybackActions)
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT)
  const [pathname, setPathname] = useState(() => {
    if (typeof window === 'undefined') {
      return '/'
    }

    return normalizeDemoPath(window.location.pathname)
  })
  const [helpVisible, setHelpVisible] = useState(false)

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
    setPresenting(false)
    useAppStore.getState().setPlaybackRate(1)
  }, [pathname, setActiveScenePath, setPresenting])

  // Leaving browser fullscreen (Esc is taken by the browser there) also ends lecture mode.
  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) setPresenting(false)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [setPresenting])

  const enterPresenting = () => {
    setPresenting(true)
    document.documentElement.requestFullscreen?.().catch(() => {})
  }
  const exitPresenting = () => {
    setPresenting(false)
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {})
  }

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
    onToggleHelp: () => setHelpVisible((v) => !v),
    onToggleLargeText: () => setLargeText(!largeText),
    onTogglePresenting: () => (presenting ? exitPresenting() : enterPresenting()),
    onExitPresenting: () => {
      if (presenting) exitPresenting()
    },
    onTogglePredicting: () => setPredicting(!predicting),
  })

  const isOverviewPage = pathname === '/'
  const activeRoute = useMemo(() => findDemoRoute(pathname), [pathname])
  const activeTouchProfile = resolveTouchProfile(activeRoute?.touchProfile, ENHANCED_TOUCH_PROFILE)
  const ActiveScene = activeRoute?.Component
  const [runtimeCapabilities, setRuntimeCapabilities] = useState(() => getRuntimeCapabilities())
  const shellStyle = useMemo<CSSProperties>(
    () => ({ '--touch-target-min-size': resolveTouchTargetMinSize(activeTouchProfile) } as CSSProperties),
    [activeTouchProfile],
  )
  const presentingActive = presenting && !isOverviewPage && !isMobile
  const shellClassName = `app-shell theme-${theme}${largeText ? ' text-large' : ''}${presentingActive ? ' presenting' : ''}`

  if (!runtimeCapabilities.supported) {
    return (
      <main className={shellClassName} data-page-scroll={activeTouchProfile.pageScroll} style={shellStyle}>
        <section className="scene-missing" role="alert">
          <h1>运行环境不支持</h1>
          <p>当前窗口没有可用的 3D 图形接口，所以演示被拦住了。</p>
          <p>请用系统里的 Chrome / Edge 打开，不要用编辑器内置预览或微信内置浏览器。</p>
          <p>
            本机地址：
            <a href="http://localhost:5173/ticker-timer">http://localhost:5173/ticker-timer</a>
          </p>
          <p>若仍失败，打开 Chrome 设置 → 系统 → 打开“使用硬件加速模式”，然后重启浏览器。</p>
          <p>缺少的能力：</p>
          <ul>
            {runtimeCapabilities.missing.map((capability) => (
              <li key={capability}>{capability}</li>
            ))}
          </ul>
          <button
            className="touch-target"
            type="button"
            onClick={() => setRuntimeCapabilities(getRuntimeCapabilities())}
          >
            重新检测
          </button>
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
      <a
        href="#scene-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-2 focus:bg-white focus:dark:bg-[var(--skip-link-bg-night)] focus:shadow-lg focus:rounded focus:text-sm focus:font-medium"
      >
        跳转到主要内容
      </a>
      <header className="app-header" data-page={isOverviewPage ? 'overview' : 'scene'}>
        <div className="app-header-title">
          <h1>{APP_BRAND_NAME}</h1>
          {!isOverviewPage && activeRoute ? <span className="app-header-scene">{activeRoute.label}</span> : null}
        </div>
        <div className="app-controls">
          {!isOverviewPage ? (
            <button className="overview-link touch-target" onClick={() => navigateTo('/')}>
              <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                <path d="M10 3.5L5.5 8l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {isMobile ? '返回' : '返回导航'}
            </button>
          ) : null}
          {!isOverviewPage && isMobile && mobilePlaybackActions.map((action) => (
            <button
              key={action.key}
              className="touch-target scene-actions-btn"
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {action.label}
            </button>
          ))}
          {isMobile ? (
            <button
              type="button"
              className="touch-target theme-toggle-icon"
              aria-label={theme === 'day' ? '切换到夜间模式' : '切换到白天模式'}
              onClick={() => setTheme(theme === 'day' ? 'night' : 'day')}
            >
              {theme === 'day' ? (
                <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
                  <path d="M15.5 12.6A6.5 6.5 0 0 1 7.4 4.5a6.5 6.5 0 1 0 8.1 8.1z" fill="currentColor" />
                </svg>
              ) : (
                <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
                  <circle cx="10" cy="10" r="3.6" fill="currentColor" />
                  <path d="M10 1.8v2.4M10 15.8v2.4M1.8 10h2.4M15.8 10h2.4M4.2 4.2l1.7 1.7M14.1 14.1l1.7 1.7M4.2 15.8l1.7-1.7M14.1 5.9l1.7-1.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              )}
            </button>
          ) : (
            <>
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
              {!isOverviewPage ? (
                <button
                  type="button"
                  className="touch-target large-text-toggle"
                  aria-keyshortcuts="P"
                  title="讲解模式：只显示 3D 并全屏，Esc 退出（快捷键 P）"
                  onClick={enterPresenting}
                >
                  讲解
                </button>
              ) : null}
              <button
                type="button"
                className={`touch-target large-text-toggle ${largeText ? 'active' : ''}`.trim()}
                aria-pressed={largeText}
                aria-keyshortcuts="L"
                title="课堂大字：放大读数、图表与 3D 标签（快捷键 L）"
                onClick={() => setLargeText(!largeText)}
              >
                大字
              </button>
              <button
                type="button"
                className="touch-target shortcut-help-btn"
                title="快捷键帮助 (?)"
                aria-label="快捷键帮助"
                onClick={() => setHelpVisible(true)}
              >
                ?
              </button>
            </>
          )}
        </div>
      </header>
      {presentingActive ? (
        <button type="button" className="touch-target presenting-exit" onClick={exitPresenting}>
          退出讲解
        </button>
      ) : null}
      <section className="scene-container" id="scene-content">
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
      <ShortcutHelpOverlay visible={helpVisible} onClose={() => setHelpVisible(false)} />
    </main>
  )
}

export default App
