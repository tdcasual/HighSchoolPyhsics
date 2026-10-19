import { memo, useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import type { DemoRoute } from '../app/demoRoutes'
import { shouldWarmRouteOnOverview } from '../app/routeWarmupPolicy'
import { safePreload } from '../app/safePreload'
import { PHYSICS_REGIONS, TEXTBOOK_VOLUMES, findVolumeById } from '../ui/navigation/regionData'

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

  // Chapters in textbook order, scenes in each chapter's teaching order; card numbers run across
  // the page and match the 1–9 shortcuts (see orderRoutesForOverview).
  const routesById = new Map(routes.map((route) => [route.pageId, route]))
  let runningIndex = 0
  const indexedGroups = PHYSICS_REGIONS.flatMap((region) => {
    const regionRoutes = region.scenePageIds
      .map((pageId) => routesById.get(pageId))
      .filter((route): route is DemoRoute => route !== undefined)
      .map((route) => ({ route, index: ++runningIndex }))
    const volume = findVolumeById(region.volumeId)
    return regionRoutes.length > 0 && volume ? [{ region, volume, routes: regionRoutes }] : []
  })
  const volumeChips = TEXTBOOK_VOLUMES.flatMap((volume) => {
    const groups = indexedGroups.filter((group) => group.volume.id === volume.id)
    return groups.length > 0
      ? [{ volume, firstRegionId: groups[0].region.id, count: groups.reduce((sum, group) => sum + group.routes.length, 0) }]
      : []
  })

  return (
    <section className="scene-overview" data-testid="overview-page">
      <header className="scene-overview-header">
        <span className="scene-overview-kicker">物理演示</span>
        <h1 className="scene-overview-title">高中物理 3D 课堂</h1>
        <p className="scene-overview-count">
          {routes.length} 个交互演示场景 · 按人教版教材章节排列
        </p>
        {volumeChips.length > 1 ? (
          <nav className="scene-overview-jump" aria-label="教材分册">
            {volumeChips.map(({ volume, firstRegionId, count }) => (
              <a
                key={volume.id}
                href={`#region-${firstRegionId}`}
                className="scene-overview-jump-link"
                style={{ '--scene-card-accent': volume.color } as CSSProperties}
                onClick={(event) => {
                  event.preventDefault()
                  document.getElementById(`region-${firstRegionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
              >
                {volume.name}
                <span>{count}</span>
              </a>
            ))}
          </nav>
        ) : null}
      </header>

      <main className="scene-overview-groups">
        {indexedGroups.map(({ region, volume, routes: regionRoutes }) => (
          <section
            key={region.id}
            id={`region-${region.id}`}
            className="scene-overview-group"
            aria-labelledby={`region-${region.id}-title`}
            style={{ '--scene-card-accent': volume.color } as CSSProperties}
          >
            <div className="scene-overview-group-header">
              <span className="scene-overview-group-dot" />
              <span className="scene-overview-group-volume">{volume.shortName}</span>
              <h2 id={`region-${region.id}-title`} className="scene-overview-group-name">{region.name}</h2>
              <span className="scene-overview-group-desc">{region.description}</span>
            </div>
            <div className="scene-overview-grid">
              {regionRoutes.map(({ route, index }) => (
                <SceneCard
                  key={route.pageId}
                  route={route}
                  index={index}
                  accent={volume.color}
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
