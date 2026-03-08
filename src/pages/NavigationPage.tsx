import { useEffect, useRef } from 'react'
import type { DemoRoute } from '../app/demoRoutes'
import { shouldWarmRouteOnOverview } from '../app/routeWarmupPolicy'
import { safePreload } from '../app/safePreload'

type NavigationPageProps = {
  routes: DemoRoute[]
  onOpenRoute: (path: string) => void
}

const WARMUP_HOVER_DELAY_MS = 120
const MAX_SHORTCUT_ROUTE_COUNT = 9
const FALLBACK_OVERVIEW_LABEL = '演示'
const FALLBACK_OVERVIEW_TAG = '课堂演示'
const FALLBACK_OVERVIEW_SUMMARY = '课堂演示信息待补充'
const FALLBACK_OVERVIEW_TONE = 'scope'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isNonBlankText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isOverviewTone(value: unknown): value is 'scope' | 'cyclotron' | 'mhd' | 'oersted' {
  return value === 'scope' || value === 'cyclotron' || value === 'mhd' || value === 'oersted'
}

function resolveOverviewLabel(label: unknown): string {
  return isNonBlankText(label) ? label : FALLBACK_OVERVIEW_LABEL
}

function resolveOverviewMeta(meta: unknown): {
  tag: string
  summary: string
  highlights: string[]
  tone: 'scope' | 'cyclotron' | 'mhd' | 'oersted'
} {
  if (!isRecord(meta)) {
    return {
      tag: FALLBACK_OVERVIEW_TAG,
      summary: FALLBACK_OVERVIEW_SUMMARY,
      highlights: [],
      tone: FALLBACK_OVERVIEW_TONE,
    }
  }

  const highlights = Array.isArray(meta.highlights) ? meta.highlights.filter(isNonBlankText) : []

  return {
    tag: isNonBlankText(meta.tag) ? meta.tag : FALLBACK_OVERVIEW_TAG,
    summary: isNonBlankText(meta.summary) ? meta.summary : FALLBACK_OVERVIEW_SUMMARY,
    highlights,
    tone: isOverviewTone(meta.tone) ? meta.tone : FALLBACK_OVERVIEW_TONE,
  }
}

function formatShortcutTip(routeCount: number): string {
  const shortcutCount = Math.min(routeCount, MAX_SHORTCUT_ROUTE_COUNT)

  if (shortcutCount <= 0) {
    return '快捷键: D/N 切换昼夜。'
  }

  if (shortcutCount === 1) {
    return '快捷键: 1 进入演示, D/N 切换昼夜。'
  }

  if (routeCount > MAX_SHORTCUT_ROUTE_COUNT) {
    return '快捷键: 1-9 进入前 9 个演示, D/N 切换昼夜。'
  }

  return `快捷键: 1-${shortcutCount} 进入演示, D/N 切换昼夜。`
}

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

    safePreload(route.preload)
  }

  const scheduleWarmRoute = (route: DemoRoute) => {
    if (!canWarmRoutes) {
      return
    }

    clearWarmupTimer()
    warmupTimerRef.current = window.setTimeout(() => {
      warmupTimerRef.current = null
      safePreload(route.preload)
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
            <p className="overview-shortcut-tip">{formatShortcutTip(routes.length)}</p>
          </div>
        </div>

        <div className="overview-grid">
          {routes.map((route, index) => {
            const label = resolveOverviewLabel(route.label)
            const meta = resolveOverviewMeta(route.meta)

            return (
              <article key={route.path} className={`overview-card tone-${meta.tone}`}>
                <div className="overview-card-head">
                  <p className="overview-card-index">{String(index + 1).padStart(2, '0')}</p>
                  <p className="overview-card-tag">{meta.tag}</p>
                </div>
                <h3>{label}</h3>
                <p className="overview-card-summary">{meta.summary}</p>
                {meta.highlights.length > 0 ? (
                  <ul className="overview-points">
                    {meta.highlights.map((item, itemIndex) => (
                      <li key={`${route.path}-${itemIndex}-${item}`}>{item}</li>
                    ))}
                  </ul>
                ) : null}
                <button
                  className="touch-target overview-enter"
                  aria-keyshortcuts={String(index + 1)}
                  title={`快捷键 ${index + 1}`}
                  onPointerDown={(event) => {
                    if (event.pointerType !== 'mouse') {
                      warmRouteNow(route)
                    }
                  }}
                  onPointerEnter={() => scheduleWarmRoute(route)}
                  onPointerLeave={clearWarmupTimer}
                  onBlur={clearWarmupTimer}
                  onFocus={() => warmRouteNow(route)}
                  onClick={() => {
                    clearWarmupTimer()
                    onOpenRoute(route.path)
                  }}
                >
                  <span>进入{label}</span>
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
