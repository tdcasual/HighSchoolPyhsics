import type { MobilePlaybackAction } from '../../store/useAppStore'

type SceneActionsProps = {
  actions: MobilePlaybackAction[]
  activeKey?: string
}

export function SceneActions({ actions, activeKey }: SceneActionsProps) {
  return (
    <div className="scene-actions">
      {actions.map((action) => {
        const isActive = activeKey === action.key
        const className = `touch-target ${isActive ? 'active' : ''}`.trim()
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
