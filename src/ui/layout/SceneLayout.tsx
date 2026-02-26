import { useEffect, useMemo, useState, type ReactNode } from 'react'

type LayoutTier = 'desktop' | 'tablet' | 'mobile'

type SceneLayoutProps = {
  controls: ReactNode
  viewport: ReactNode
}

function resolveLayoutTier(width: number): LayoutTier {
  if (width < 768) {
    return 'mobile'
  }
  if (width < 1200) {
    return 'tablet'
  }
  return 'desktop'
}

function readViewportWidth(): number {
  if (typeof window === 'undefined') {
    return 1280
  }
  return window.innerWidth
}

export function SceneLayout({ controls, viewport }: SceneLayoutProps) {
  const [tier, setTier] = useState<LayoutTier>(() => resolveLayoutTier(readViewportWidth()))
  const [controlsExpanded, setControlsExpanded] = useState<boolean>(() => resolveLayoutTier(readViewportWidth()) !== 'mobile')

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const onResize = () => {
      setTier(resolveLayoutTier(window.innerWidth))
    }

    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    setControlsExpanded(tier !== 'mobile')
  }, [tier])

  const compact = tier !== 'desktop'
  const toggleLabel = controlsExpanded ? '收起参数面板' : '展开参数面板'
  const controlsPanel = (
    <aside
      className={`control-panel ${compact ? 'control-panel--compact' : ''} ${controlsExpanded ? 'control-panel--expanded' : 'control-panel--collapsed'}`}
      aria-hidden={compact ? !controlsExpanded : false}
      data-compact={compact ? 'true' : 'false'}
      hidden={compact && !controlsExpanded}
    >
      {controls}
    </aside>
  )

  const viewportPanel = <section className="viewport-panel">{viewport}</section>
  const scaffoldClassName = useMemo(() => `scene-layout scene-layout--${tier}`, [tier])

  return (
    <div className={scaffoldClassName}>
      {compact ? (
        <div className="scene-toolbar" role="toolbar" aria-label="场景参数工具条">
          <button
            className="scene-toolbar-toggle"
            type="button"
            aria-expanded={controlsExpanded}
            onClick={() => setControlsExpanded((value) => !value)}
          >
            {toggleLabel}
          </button>
        </div>
      ) : null}
      {compact ? (
        <>
          {viewportPanel}
          {controlsPanel}
        </>
      ) : (
        <>
          {controlsPanel}
          {viewportPanel}
        </>
      )}
    </div>
  )
}
