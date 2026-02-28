import { useEffect, useRef } from 'react'
import type { DemoRoute } from '../app/demoRoutes'
import { shouldWarmRouteOnOverview } from '../app/routeWarmupPolicy'

type NavigationPageProps = {
  routes: DemoRoute[]
  onOpenRoute: (path: string) => void
}

const WARMUP_HOVER_DELAY_MS = 120

export function NavigationPage({ routes, onOpenRoute }: NavigationPageProps) {
  const canWarmRoutes = shouldWarmRouteOnOverview()
  const warmupTimerRef = useRef<number | null>(null)

  const clearWarmupTimer = () => {
    if (warmupTimerRef.current === null) {
      return
    }
    window.clearTimeout(warmupTimerRef.current)
    warmupTimerRef.current = null
  }

  useEffect(() => {
    return () => {
      clearWarmupTimer()
    }
  }, [])

  const warmRouteNow = (route: DemoRoute) => {
    if (!canWarmRoutes) {
      return
    }

    void route.preload()
  }

  const scheduleWarmRoute = (route: DemoRoute) => {
    if (!canWarmRoutes) {
      return
    }

    clearWarmupTimer()
    warmupTimerRef.current = window.setTimeout(() => {
      warmupTimerRef.current = null
      void route.preload()
    }, WARMUP_HOVER_DELAY_MS)
  }

  return (
    <section className="overview-page" data-testid="overview-page">
      <div className="overview-shell">
        <div className="overview-hero">
          <div className="overview-hero-main">
            <p className="overview-kicker">课堂演示入口</p>
            <h2>演示导航</h2>
            <p className="overview-lead">从单入口进入各个演示页面，避免课堂演示中跨页干扰。</p>
          </div>
          <div className="overview-hero-note">
            <p className="overview-note-title">课堂建议</p>
            <p className="overview-note-text">先看结构，再调参数，最后做对比。</p>
            <p className="overview-shortcut-tip">快捷键: 1-4 进入演示, D/N 切换昼夜。</p>
          </div>
        </div>

        <div className="overview-grid">
          {routes.map((route, index) => {
            const meta = route.meta

            return (
              <article key={route.path} className={`overview-card tone-${meta.tone}`}>
                <div className="overview-card-head">
                  <p className="overview-card-index">{String(index + 1).padStart(2, '0')}</p>
                  <p className="overview-card-tag">{meta.tag}</p>
                </div>
                <h3>{route.label}</h3>
                <p className="overview-card-summary">{meta.summary}</p>
                <ul className="overview-points">
                  {meta.highlights.map((item) => (
                    <li key={`${route.path}-${item}`}>{item}</li>
                  ))}
                </ul>
                <button
                  className="touch-target overview-enter"
                  aria-keyshortcuts={String(index + 1)}
                  title={`快捷键 ${index + 1}`}
                  onPointerEnter={() => scheduleWarmRoute(route)}
                  onPointerLeave={clearWarmupTimer}
                  onBlur={clearWarmupTimer}
                  onFocus={() => warmRouteNow(route)}
                  onClick={() => {
                    clearWarmupTimer()
                    onOpenRoute(route.path)
                  }}
                >
                  <span>进入{route.label}</span>
                  <span aria-hidden="true">↗</span>
                </button>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
