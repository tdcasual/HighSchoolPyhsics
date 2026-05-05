import { useCallback, useEffect, useRef } from 'react'
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

export function NavigationPage({ routes, onOpenRoute }: NavigationPageProps) {
  const canWarmRoutes = shouldWarmRouteOnOverview()
  const warmupTimerRef = useRef<number | null>(null)
  const groupRefs = useRef<Record<string, HTMLDivElement | null>>({})

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

  const scrollToRegion = useCallback((regionId: string) => {
    const el = groupRefs.current[regionId]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  const totalScenes = routes.length

  return (
    <section className="overview-page linear-explorer" data-testid="overview-page">
      {/* Header */}
      <div className="linear-header">
        <h1 className="linear-title">物理演示</h1>
        <p className="linear-subtitle">高中物理课堂 3D 交互演示</p>
      </div>

      {/* Product Preview */}
      <div className="linear-preview" aria-hidden="true">
        <div className="linear-preview-frame">
          <div className="linear-preview-left" />
          <div className="linear-preview-right">
            <div className="linear-preview-topbar" />
            <div className="linear-preview-viewport">
              <div className="linear-preview-orb" />
              <div className="linear-preview-ring" />
              <div className="linear-preview-ring-2" />
            </div>
          </div>
        </div>
      </div>

      {/* Workspace */}
      <div className="linear-workspace">
        {/* Sidebar */}
        <nav className="linear-sidebar" aria-label="物理区域">
          <div className="linear-sidebar-header">
            <span className="linear-sidebar-title">区域</span>
            <span className="linear-sidebar-count">{PHYSICS_REGIONS.length}</span>
          </div>
          <div className="linear-sidebar-list">
            {PHYSICS_REGIONS.map((region) => {
              const theme = THEME[region.id] ?? THEME.electrostatics
              const sceneCount = region.scenePageIds.length
              return (
                <button
                  key={region.id}
                  className="linear-sidebar-item touch-target"
                  onClick={() => scrollToRegion(region.id)}
                >
                  <span
                    className="linear-sidebar-dot"
                    style={{ backgroundColor: theme.dot }}
                  />
                  <span className="linear-sidebar-name">{region.name}</span>
                  {sceneCount > 0 && (
                    <span className="linear-sidebar-badge">{sceneCount}</span>
                  )}
                </button>
              )
            })}
          </div>
        </nav>

        {/* Main */}
        <main className="linear-main">
          <div className="linear-main-header">
            <span className="linear-main-title">全部演示</span>
            <span className="linear-main-count">{totalScenes} 个场景</span>
          </div>

          <div className="linear-list">
            {PHYSICS_REGIONS.map((region) => {
              const theme = THEME[region.id] ?? THEME.electrostatics
              const regionRoutes = routes.filter((r) =>
                region.scenePageIds.includes(r.pageId),
              )

              return (
                <div
                  key={region.id}
                  ref={(el) => { groupRefs.current[region.id] = el }}
                  className="linear-group"
                >
                  <div className="linear-group-header">
                    <span
                      className="linear-group-dot"
                      style={{ backgroundColor: theme.dot }}
                    />
                    <span className="linear-group-name">{region.name}</span>
                    <span className="linear-group-desc">{region.description}</span>
                  </div>

                  {regionRoutes.length === 0 ? (
                    <div className="linear-row linear-row-empty">
                      <span>该区域暂无演示场景</span>
                    </div>
                  ) : (
                    regionRoutes.map((route) => {
                      const label = route.label || '演示'
                      const tag = route.meta?.tag || '课堂演示'

                      return (
                        <button
                          key={route.pageId}
                          className="linear-row touch-target"
                          onPointerEnter={() => handlePointerEnter(route)}
                          onPointerLeave={handlePointerLeave}
                          onPointerDown={(event) => {
                            if (event.pointerType !== 'mouse') {
                              warmRouteNow(route)
                            }
                          }}
                          onFocus={() => warmRouteNow(route)}
                          onBlur={handlePointerLeave}
                          onClick={() => handleClick(route)}
                        >
                          <span
                            className="linear-row-dot"
                            style={{ backgroundColor: theme.dot }}
                          />
                          <span className="linear-row-name">{label}</span>
                          <span className="linear-row-tag">{tag}</span>
                        </button>
                      )
                    })
                  )}
                </div>
              )
            })}
          </div>
        </main>
      </div>
    </section>
  )
}
