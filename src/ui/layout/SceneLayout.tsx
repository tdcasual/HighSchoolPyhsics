import type { ReactNode } from 'react'

type SceneLayoutProps = {
  controls: ReactNode
  viewport: ReactNode
}

export function SceneLayout({ controls, viewport }: SceneLayoutProps) {
  return (
    <div className="scene-layout">
      <aside className="control-panel">{controls}</aside>
      <section className="viewport-panel">{viewport}</section>
    </div>
  )
}
