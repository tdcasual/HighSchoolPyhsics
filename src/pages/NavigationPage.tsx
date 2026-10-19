import { memo, useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import type { DemoRoute } from '../app/demoRoutes'
import { shouldWarmRouteOnOverview } from '../app/routeWarmupPolicy'
import { safePreload } from '../app/safePreload'
import { PHYSICS_REGIONS } from '../ui/navigation/regionData'

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
        <span className="scene-card-tag">{route.meta?.tag}</span>
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

  const indexedGroups = PHYSICS_REGIONS.reduce<
    { region: typeof PHYSICS_REGIONS[number]; routes: { route: DemoRoute; index: number }[] }[]
  >((acc, region) => {
    const regionRoutes = routes.filter((r) =>
      region.scenePageIds.includes(r.pageId),
    )
    if (regionRoutes.length === 0) return acc
    const indexed = regionRoutes.map((route) => {
      const index = acc.reduce((sum, g) => sum + g.routes.length, 0) + regionRoutes.indexOf(route) + 1
      return { route, index }
    })
    acc.push({ region, routes: indexed })
    return acc
  }, [])

  return (
    <section className="scene-overview" data-testid="overview-page">
      <header className="scene-overview-header">
        <span className="scene-overview-kicker">物理演示</span>
        <h1 className="scene-overview-title">高中物理 3D 课堂</h1>
        <p className="scene-overview-count">
          {routes.length} 个交互演示场景 · {indexedGroups.length} 个专题
        </p>
        {indexedGroups.length > 1 ? (
          <nav className="scene-overview-jump" aria-label="专题">
            {indexedGroups.map(({ region, routes: regionRoutes }) => (
              <a
                key={region.id}
                href={`#region-${region.id}`}
                className="scene-overview-jump-link"
                style={{ '--scene-card-accent': region.hoverColor } as CSSProperties}
                onClick={(event) => {
                  event.preventDefault()
                  document.getElementById(`region-${region.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
              >
                {region.name}
                <span>{regionRoutes.length}</span>
              </a>
            ))}
          </nav>
        ) : null}
      </header>

      <main className="scene-overview-groups">
        {indexedGroups.map(({ region, routes: regionRoutes }) => (
          <section
            key={region.id}
            id={`region-${region.id}`}
            className="scene-overview-group"
            aria-labelledby={`region-${region.id}-title`}
            style={{ '--scene-card-accent': region.hoverColor } as CSSProperties}
          >
            <div className="scene-overview-group-header">
              <span className="scene-overview-group-dot" />
              <h2 id={`region-${region.id}-title`} className="scene-overview-group-name">{region.name}</h2>
              <span className="scene-overview-group-desc">{region.description}</span>
            </div>
            <div className="scene-overview-grid">
              {regionRoutes.map(({ route, index }) => (
                <SceneCard
                  key={route.pageId}
                  route={route}
                  index={index}
                  accent={region.hoverColor}
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
