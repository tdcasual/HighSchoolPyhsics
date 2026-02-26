import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import {
  DEMO_ROUTES,
  findDemoRoute,
  normalizeDemoPath,
} from './app/demoRoutes'
import { NavigationPage } from './pages/NavigationPage'
import { useAppStore } from './store/useAppStore'

function App() {
  const theme = useAppStore((state) => state.theme)
  const setTheme = useAppStore((state) => state.setTheme)
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

  const isOverviewPage = pathname === '/'
  const activeRoute = useMemo(() => findDemoRoute(pathname), [pathname])
  const ActiveScene = activeRoute?.Component

  return (
    <main className={`app-shell theme-${theme}`}>
      <header className="app-header">
        <h1>3D Electromagnetics Lab</h1>
        <div className="app-controls">
          {!isOverviewPage ? (
            <button className="overview-link" onClick={() => navigateTo('/')}>
              返回导航
            </button>
          ) : null}
          <div className="theme-switch">
            <button
              className={theme === 'day' ? 'active' : ''}
              onClick={() => setTheme('day')}
            >
              白天模式
            </button>
            <button
              className={theme === 'night' ? 'active' : ''}
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
            <NavigationPage routes={DEMO_ROUTES} onOpenRoute={navigateTo} />
          ) : ActiveScene ? (
            <ActiveScene />
          ) : (
            <div className="scene-missing">
              <h2>页面不存在</h2>
              <p>请选择一个有效演示页面，或先返回导航：</p>
              <div className="scene-missing-links">
                <button onClick={() => navigateTo('/')}>返回导航</button>
                {DEMO_ROUTES.map((route) => (
                  <button key={route.path} onClick={() => navigateTo(route.path)}>
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
