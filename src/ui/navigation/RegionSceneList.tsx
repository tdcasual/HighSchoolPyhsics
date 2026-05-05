import { useRef, useEffect } from 'react'
import type { DemoRoute } from '../../app/demoRoutes'
import type { PhysicsRegion } from './regionData'

export type RegionSceneListProps = {
  region: PhysicsRegion
  routes: DemoRoute[]
  onOpenRoute: (path: string) => void
  onClose: () => void
  canWarmRoutes: boolean
  onWarmRoute: (route: DemoRoute) => void
  onCancelWarmRoute: () => void
}

const WARMUP_HOVER_DELAY_MS = 120

export function RegionSceneList({
  region,
  routes,
  onOpenRoute,
  onClose,
  canWarmRoutes,
  onWarmRoute,
  onCancelWarmRoute,
}: RegionSceneListProps) {
  const warmupTimerRef = useRef<number | null>(null)
  const regionRoutes = routes.filter((r) => region.scenePageIds.includes(r.pageId))

  useEffect(() => {
    return () => {
      if (warmupTimerRef.current !== null) {
        window.clearTimeout(warmupTimerRef.current)
      }
    }
  }, [])

  const handlePointerEnter = (route: DemoRoute) => {
    if (!canWarmRoutes) return
    if (warmupTimerRef.current !== null) {
      window.clearTimeout(warmupTimerRef.current)
    }
    warmupTimerRef.current = window.setTimeout(() => {
      warmupTimerRef.current = null
      onWarmRoute(route)
    }, WARMUP_HOVER_DELAY_MS)
  }

  const handlePointerLeave = () => {
    if (warmupTimerRef.current !== null) {
      window.clearTimeout(warmupTimerRef.current)
      warmupTimerRef.current = null
    }
    onCancelWarmRoute()
  }

  return (
    <div className="region-scene-panel">
      <div className="region-scene-panel-header">
        <div className="region-scene-panel-title-row">
          <span
            className="region-scene-panel-dot"
            style={{ backgroundColor: region.color }}
          />
          <h3 className="region-scene-panel-title">{region.name}</h3>
        </div>
        <p className="region-scene-panel-desc">{region.description}</p>
        <button
          className="region-scene-panel-close touch-target"
          onClick={onClose}
          aria-label="关闭场景列表"
          title="关闭"
        >
          ✕
        </button>
      </div>

      <div className="region-scene-panel-body">
        {regionRoutes.length === 0 ? (
          <div className="region-scene-panel-empty">
            <p>该区域暂无演示场景</p>
            <p className="region-scene-panel-empty-hint">敬请期待后续更新</p>
          </div>
        ) : (
          <div className="region-scene-list">
            {regionRoutes.map((route, index) => {
              const label = route.label || '演示'
              const tag = route.meta?.tag || '课堂演示'
              const summary = route.meta?.summary || ''

              return (
                <button
                  key={route.pageId}
                  className="region-scene-item touch-target"
                  onPointerEnter={() => handlePointerEnter(route)}
                  onPointerLeave={handlePointerLeave}
                  onPointerDown={(event) => {
                    if (event.pointerType !== 'mouse') {
                      onWarmRoute(route)
                    }
                  }}
                  onFocus={() => onWarmRoute(route)}
                  onBlur={handlePointerLeave}
                  onClick={() => {
                    handlePointerLeave()
                    onOpenRoute(route.path)
                  }}
                  aria-keyshortcuts={String(index + 1)}
                >
                  <div className="region-scene-item-head">
                    <span className="region-scene-item-index">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="region-scene-item-tag">{tag}</span>
                  </div>
                  <div className="region-scene-item-name">{label}</div>
                  <div className="region-scene-item-summary">{summary}</div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
