import type { PlaybackAction } from '../layout/playbackAction'

type SceneActionsProps = {
  actions: PlaybackAction[]
  activeKey?: string
  layout?: 'row' | 'column' | 'grid-2'
}

export function SceneActions({ actions, activeKey, layout = 'row' }: SceneActionsProps) {
  const layoutClass = layout === 'column' ? 'scene-actions-column' : layout === 'grid-2' ? 'scene-actions-grid-2' : ''
  return (
    <div className={['scene-actions', layoutClass].filter(Boolean).join(' ')}>
      {actions.map((action) => {
        const isActive = activeKey === action.key
        const className = ['touch-target', isActive ? 'active' : ''].filter(Boolean).join(' ')
        return (
          <button
            key={action.key}
            className={className}
            onClick={action.onClick}
            disabled={action.disabled}
            aria-pressed={activeKey ? isActive : undefined}
          >
            {action.label}
          </button>
        )
      })}
    </div>
  )
}
