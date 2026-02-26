type SceneAction = {
  key: string
  label: string
  onClick: () => void
  disabled?: boolean
}

type SceneActionsProps = {
  actions: SceneAction[]
  activeKey?: string
}

export function SceneActions({ actions, activeKey }: SceneActionsProps) {
  return (
    <div className="scene-actions">
      {actions.map((action) => (
        <button
          key={action.key}
          className={activeKey === action.key ? 'active' : ''}
          onClick={action.onClick}
          disabled={action.disabled}
        >
          {action.label}
        </button>
      ))}
    </div>
  )
}
