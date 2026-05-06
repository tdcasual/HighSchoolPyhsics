import { useEffect } from 'react'

const SHORTCUT_GROUPS = [
  {
    title: '全局',
    items: [
      { keys: ['D'], desc: '切换到白天模式' },
      { keys: ['N'], desc: '切换到夜间模式' },
      { keys: ['?'], desc: '显示/隐藏快捷键帮助' },
    ],
  },
  {
    title: '导航页',
    items: [
      { keys: ['1 ~ 9'], desc: '快速进入第 1~9 个演示' },
    ],
  },
  {
    title: '通用',
    items: [
      { keys: ['Esc'], desc: '关闭弹窗/返回导航页' },
    ],
  },
]

type ShortcutHelpOverlayProps = {
  visible: boolean
  onClose: () => void
}

export function ShortcutHelpOverlay({ visible, onClose }: ShortcutHelpOverlayProps) {
  useEffect(() => {
    if (!visible) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [visible, onClose])

  if (!visible) return null

  return (
    <div
      className="shortcut-help-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="快捷键帮助"
      onClick={onClose}
    >
      <div className="shortcut-help-panel" onClick={(e) => e.stopPropagation()}>
        <div className="shortcut-help-header">
          <h2>快捷键</h2>
          <button
            type="button"
            className="shortcut-help-close"
            aria-label="关闭"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="shortcut-help-body">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title} className="shortcut-help-group">
              <h3>{group.title}</h3>
              <ul>
                {group.items.map((item) => (
                  <li key={item.desc}>
                    <kbd>{item.keys.join(' / ')}</kbd>
                    <span>{item.desc}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
