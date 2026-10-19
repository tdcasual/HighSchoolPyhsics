import { memo, useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import type { DemoRoute } from '../app/demoRoutes'
import { shouldWarmRouteOnOverview } from '../app/routeWarmupPolicy'
import { safePreload } from '../app/safePreload'
import { NAVIGATION_VIEWS, findNavigationView, type NavigationViewId } from '../ui/navigation/navigationViews'
import { SegmentedControl } from '../ui/controls/SegmentedControl'
import { useAppStore } from '../store/useAppStore'

export type NavigationPageProps = {
  routes: DemoRoute[]
  onOpenRoute: (path: string) => void
}

const WARMUP_HOVER_DELAY_MS = 120

function resolveThumbnailUrl(pageId: string): string {
  return `/screenshots/${pageId}.webp`
}

const SceneCard = memo(function SceneCard({
  route,
  index,
  accent,
  onPointerEnter,
  onPointerLeave,
  onPointerDown,
  onFocus,
  onBlur,
  onClick,
}: {
  route: DemoRoute
  index: number
  accent: string
  onPointerEnter: (route: DemoRoute) => void
  onPointerLeave: () => void
  onPointerDown: (route: DemoRoute) => void
  onFocus: (route: DemoRoute) => void
  onBlur: () => void
  onClick: (route: DemoRoute) => void
}) {
  const [thumbnailFailed, setThumbnailFailed] = useState(false)
  const indexStr = String(index).padStart(2, '0')
  return (
    <button
      className="scene-card touch-target"
      style={{ '--scene-card-accent': accent } as CSSProperties}
      onPointerEnter={() => onPointerEnter(route)}
      onPointerLeave={onPointerLeave}
      onPointerDown={(event) => {
        if (event.pointerType !== 'mouse') {
          onPointerDown(route)
        }
      }}
      onFocus={() => onFocus(route)}
      onBlur={onBlur}
      onClick={() => onClick(route)}
    >
      <span className="scene-card-thumb" aria-hidden="true">
        {thumbnailFailed ? (
          <span className="scene-card-thumb-fallback">{route.meta?.tag}</span>
        ) : (
          <img
            src={resolveThumbnailUrl(route.pageId)}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setThumbnailFailed(true)}
          />
        )}
        <span className="scene-card-index">{indexStr}</span>
      </span>
      <span className="scene-card-body">
        <span className="scene-card-name">{route.label}</span>
        <span className="scene-card-summary">{route.meta?.summary}</span>
        <span className="scene-card-tags">
          {route.meta?.level ? <span className="scene-card-level">{route.meta.level}</span> : null}
          <span className="scene-card-tag">{route.meta?.tag}</span>
        </span>
      </span>
    </button>
  )
})

export function NavigationPage({ routes, onOpenRoute }: NavigationPageProps) {
  const canWarmRoutes = shouldWarmRouteOnOverview()
  const warmupTimerRef = useRef<number | null>(null)
  useEffect(() => {
    return () => {
      if (warmupTimerRef.current !== null) {
        window.clearTimeout(warmupTimerRef.current)
      }
    }
  }, [])

  const cancelWarmRoute = useCallback(() => {
    if (warmupTimerRef.current !== null) {
      window.clearTimeout(warmupTimerRef.current)
      warmupTimerRef.current = null
    }
  }, [])

  const warmRouteNow = useCallback(
    (route: DemoRoute) => {
      if (!canWarmRoutes) return
      safePreload(route.preload)
    },
    [canWarmRoutes],
  )

  const handlePointerEnter = useCallback(
    (route: DemoRoute) => {
      if (!canWarmRoutes) return
      cancelWarmRoute()
      warmupTimerRef.current = window.setTimeout(() => {
        warmupTimerRef.current = null
        warmRouteNow(route)
      }, WARMUP_HOVER_DELAY_MS)
    },
    [canWarmRoutes, cancelWarmRoute, warmRouteNow],
  )

  const handlePointerLeave = useCallback(() => {
    cancelWarmRoute()
  }, [cancelWarmRoute])

  const handleClick = useCallback(
    (route: DemoRoute) => {
      handlePointerLeave()
      onOpenRoute(route.path)
    },
    [handlePointerLeave, onOpenRoute],
  )

  const navView = useAppStore((state) => state.navView)
  const setNavView = useAppStore((state) => state.setNavView)
  const view = findNavigationView(navView)
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  // Cards are numbered across the page in the view's order; the 1–9 shortcuts follow the same
  // numbers, so they always open what the teacher sees.
  const routesById = new Map(routes.map((route) => [route.pageId, route]))
  const needle = query.trim().toLowerCase()
  // A search hits a scene by its own text or by its group (a chapter title names the knowledge point).
  const matches = (route: DemoRoute, group: { title: string; description: string }) =>
    !needle ||
    [route.label, route.meta?.summary, route.meta?.tag, route.meta?.level, ...(route.meta?.highlights ?? []), group.title, group.description]
      .some((text) => text?.toLowerCase().includes(needle))
  let runningIndex = 0
  const indexedGroups = view.groups.flatMap((group) => {
    const groupRoutes = group.scenePageIds
      .map((pageId) => routesById.get(pageId))
      .filter((route): route is DemoRoute => route !== undefined && matches(route, group))
      .map((route) => ({ route, index: ++runningIndex }))
    return groupRoutes.length > 0 ? [{ group, routes: groupRoutes }] : []
  })
  const numberedRoutes = indexedGroups.flatMap((group) => group.routes.map(({ route }) => route))
  const jumpChips = indexedGroups.reduce<{ id: string; label: string; anchor: string; color: string; count: number }[]>(
    (chips, { group, routes: groupRoutes }) => {
      const jump = group.jumpGroup ?? { id: group.id, label: group.title }
      const existing = chips.find((chip) => chip.id === jump.id)
      if (existing) existing.count += groupRoutes.length
      else chips.push({ id: jump.id, label: jump.label, anchor: group.id, color: group.color, count: groupRoutes.length })
      return chips
    },
    [],
  )

  const numberedRoutesRef = useRef(numberedRoutes)
  useEffect(() => {
    numberedRoutesRef.current = numberedRoutes
  })
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target
      const typing = target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
      if (event.key === '/' && !typing) {
        event.preventDefault()
        searchRef.current?.focus()
        return
      }
      if (typing || !/^[1-9]$/.test(event.key)) return
      const route = numberedRoutesRef.current[Number(event.key) - 1]
      if (!route || typeof route.path !== 'string') return
      event.preventDefault()
      safePreload(route.preload)
      onOpenRoute(route.path)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onOpenRoute])

  return (
    <section className="scene-overview" data-testid="overview-page">
      <header className="scene-overview-header">
        <span className="scene-overview-kicker">物理演示</span>
        <h1 className="scene-overview-title">高中物理 3D 课堂</h1>
        <p className="scene-overview-count">
          {routes.length} 个交互演示场景 · {view.caption}
        </p>
        <div className="scene-overview-toolbar">
          <SegmentedControl
            options={NAVIGATION_VIEWS.map((option) => ({ key: option.id, label: option.label }))}
            value={view.id}
            onChange={(key) => setNavView(key as NavigationViewId)}
          />
          <input
            ref={searchRef}
            type="search"
            className="scene-overview-search touch-target"
            placeholder="搜索场景、知识点（快捷键 /）"
            aria-label="搜索场景"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setQuery('')
              if (event.key === 'Enter' && numberedRoutes[0]) onOpenRoute(numberedRoutes[0].path)
            }}
          />
        </div>
        {jumpChips.length > 1 ? (
          <nav className="scene-overview-jump" aria-label="分组">
            {jumpChips.map((chip) => (
              <a
                key={chip.id}
                href={`#group-${chip.anchor}`}
                className="scene-overview-jump-link"
                style={{ '--scene-card-accent': chip.color } as CSSProperties}
                onClick={(event) => {
                  event.preventDefault()
                  document.getElementById(`group-${chip.anchor}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
              >
                {chip.label}
                <span>{chip.count}</span>
              </a>
            ))}
          </nav>
        ) : null}
      </header>

      <main className="scene-overview-groups">
        {indexedGroups.length === 0 ? (
          <p className="scene-overview-empty">没有找到与「{query.trim()}」相关的场景。</p>
        ) : null}
        {indexedGroups.map(({ group, routes: groupRoutes }) => (
          <section
            key={group.id}
            id={`group-${group.id}`}
            className="scene-overview-group"
            aria-labelledby={`group-${group.id}-title`}
            style={{ '--scene-card-accent': group.color } as CSSProperties}
          >
            <div className="scene-overview-group-header">
              <span className="scene-overview-group-dot" />
              {group.badge ? <span className="scene-overview-group-volume">{group.badge}</span> : null}
              <h2 id={`group-${group.id}-title`} className="scene-overview-group-name">{group.title}</h2>
              <span className="scene-overview-group-desc">{group.description}</span>
            </div>
            <div className="scene-overview-grid">
              {groupRoutes.map(({ route, index }) => (
                <SceneCard
                  key={route.pageId}
                  route={route}
                  index={index}
                  accent={group.color}
                  onPointerEnter={handlePointerEnter}
                  onPointerLeave={handlePointerLeave}
                  onPointerDown={warmRouteNow}
                  onFocus={warmRouteNow}
                  onBlur={handlePointerLeave}
                  onClick={handleClick}
                />
              ))}
            </div>
          </section>
        ))}
      </main>
    </section>
  )
}

export default NavigationPage
