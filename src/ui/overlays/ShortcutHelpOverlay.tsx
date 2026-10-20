import { useEffect } from 'react'
import './shortcut-help.css'

const SHORTCUT_GROUPS = [
  {
    title: '全局',
    items: [
      { keys: ['D'], desc: '切换到白天模式' },
      { keys: ['N'], desc: '切换到夜间模式' },
      { keys: ['L'], desc: '切换课堂大字（读数、图表、3D 标签放大）' },
      { keys: ['P'], desc: '演示页：讲解模式（只显示 3D 并全屏）' },
      { keys: ['H'], desc: '演示页：预测模式（遮住结论，点击「?」或「全部揭晓」）' },
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
      { keys: ['空格'], desc: '演示页：播放 / 暂停' },
      { keys: ['.', '→'], desc: '演示页：单步（转 15°、走 T/4 或到下一次过缝），按住 → 连续' },
      { keys: [',', '←'], desc: '演示页：后退一步（游标卡尺、螺旋测微器调一格）' },
      { keys: ['Esc'], desc: '关闭弹窗 / 退出讲解模式' },
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
