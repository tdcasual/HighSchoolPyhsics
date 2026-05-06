import { memo, useCallback, useEffect, useRef, useState } from 'react'
import type { DemoRoute } from '../app/demoRoutes'
import { shouldWarmRouteOnOverview } from '../app/routeWarmupPolicy'
import { safePreload } from '../app/safePreload'
import { PHYSICS_REGIONS } from '../ui/navigation/regionData'

export type NavigationPageProps = {
  routes: DemoRoute[]
  onOpenRoute: (path: string) => void
}

const THEME: Record<string, { dot: string }> = {
  electrostatics: { dot: '#818cf8' },
  electromagnetism: { dot: '#fbbf24' },
  'electromagnetic-induction': { dot: '#facc15' },
  waves: { dot: '#2dd4bf' },
  mechanics: { dot: '#a3e635' },
  thermal: { dot: '#f87171' },
}

const WARMUP_HOVER_DELAY_MS = 120

function resolveScreenshotUrl(pageId: string): string {
  return `/screenshots/${pageId}-screenshot.png`
}

const MagazineItem = memo(function MagazineItem({
  route,
  index,
  isHovered,
  onPointerEnter,
  onPointerLeave,
  onPointerDown,
  onFocus,
  onBlur,
  onClick,
}: {
  route: DemoRoute
  index: number
  isHovered: boolean
  onPointerEnter: (route: DemoRoute) => void
  onPointerLeave: () => void
  onPointerDown: (route: DemoRoute) => void
  onFocus: (route: DemoRoute) => void
  onBlur: () => void
  onClick: (route: DemoRoute) => void
}) {
  const indexStr = String(index).padStart(2, '0')
  return (
    <button
      className={`magazine-item touch-target${isHovered ? ' active' : ''}`}
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
      <span className="magazine-item-index">{indexStr}</span>
      <span className="magazine-item-name">{route.label}</span>
      <span className="magazine-item-tag">{route.meta?.tag}</span>
      <span className="magazine-item-arrow" aria-hidden="true">→</span>
    </button>
  )
})

function PreviewImage({ route }: { route: DemoRoute }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  return (
    <>
      <div className="magazine-preview-img-wrap">
        {!error ? (
          <img
            src={resolveScreenshotUrl(route.pageId)}
            alt={route.label}
            className={`magazine-preview-img${loaded ? ' loaded' : ''}`}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
          />
        ) : null}
        {(!loaded || error) ? (
          <div className="magazine-preview-placeholder">
            <span className="magazine-preview-placeholder-title">
              {route.label}
            </span>
            <span className="magazine-preview-placeholder-hint">
              {error ? '预览图加载失败' : '加载中…'}
            </span>
          </div>
        ) : null}
      </div>
      <div className="magazine-preview-meta">
        <span className="magazine-preview-name">
          {route.label}
        </span>
        <span className="magazine-preview-tag">
          {route.meta?.tag}
        </span>
      </div>
    </>
  )
}

export function NavigationPage({ routes, onOpenRoute }: NavigationPageProps) {
  const canWarmRoutes = shouldWarmRouteOnOverview()
  const warmupTimerRef = useRef<number | null>(null)
  const [hoveredRoute, setHoveredRoute] = useState<DemoRoute | null>(null)

  const previewRoute = hoveredRoute

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
      setHoveredRoute(route)
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
    { region: typeof PHYSICS_REGIONS[number]; theme: { dot: string }; routes: { route: DemoRoute; index: number }[] }[]
  >((acc, region) => {
    const theme = THEME[region.id] ?? THEME.electrostatics
    const regionRoutes = routes.filter((r) =>
      region.scenePageIds.includes(r.pageId),
    )
    if (regionRoutes.length === 0) return acc
    const indexed = regionRoutes.map((route) => {
      const index = acc.reduce((sum, g) => sum + g.routes.length, 0) + regionRoutes.indexOf(route) + 1
      return { route, index }
    })
    acc.push({ region, theme, routes: indexed })
    return acc
  }, [])

  return (
    <section className="magazine-overview" data-testid="overview-page">
      {/* Header */}
      <header className="magazine-header">
        <span className="magazine-kicker">物理演示</span>
        <h1 className="magazine-title">高中物理 3D 课堂</h1>
        <p className="magazine-count">
          {routes.length} 个交互演示场景
        </p>
      </header>

      {/* Scene list */}
      <main className="magazine-list">
        {indexedGroups.map(({ region, theme, routes: regionRoutes }) => (
          <div key={region.id} className="magazine-group">
            <div className="magazine-group-header">
              <span
                className="magazine-group-dot"
                style={{ backgroundColor: theme.dot }}
              />
              <h2 className="magazine-group-name">{region.name}</h2>
              <span className="magazine-group-desc">
                {region.description}
              </span>
            </div>
            <div className="magazine-items">
              {regionRoutes.map(({ route, index }) => (
                <MagazineItem
                  key={route.pageId}
                  route={route}
                  index={index}
                  isHovered={hoveredRoute?.pageId === route.pageId}
                  onPointerEnter={handlePointerEnter}
                  onPointerLeave={handlePointerLeave}
                  onPointerDown={warmRouteNow}
                  onFocus={warmRouteNow}
                  onBlur={handlePointerLeave}
                  onClick={handleClick}
                />
              ))}
            </div>
          </div>
        ))}
      </main>

      {/* Screenshot preview — fixed right panel */}
      <aside className="magazine-preview" aria-hidden="true">
        <div className={`magazine-preview-frame${previewRoute ? ' show' : ''}`}>
          {previewRoute ? (
            <PreviewImage key={previewRoute.pageId} route={previewRoute} />
          ) : (
            <div className="magazine-preview-empty">
              <span className="magazine-preview-empty-hint">悬停列表查看预览</span>
              <span className="magazine-preview-empty-sub">
                鼠标移至场景名称上
              </span>
            </div>
          )}
        </div>
      </aside>
    </section>
  )
}
