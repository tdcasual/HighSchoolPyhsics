# 五区布局接入规范（新演示页面模板）

本规范用于后续新增演示页面时，统一接入五区浮层布局。

## 1. 目标

- 3D 动画全屏铺底，参数/数据/图表/播放以浮层覆盖。
- 折叠侧栏后，数据浮层仍可显示课堂关键读数。
- 移动端自动切换为底部面板 + tab 布局。

## 2. SceneLayout 四个内容槽

| 槽位 | 用途 | 对应区域 |
|---|---|---|
| `controls` | 参数滑块、选择器、文本输入 | 侧栏 (SidebarPanel) |
| `dataOverlay` | 实时读数、探针值、方向指示 | 数据浮层 (FloatingPanel) |
| `chart` | 波形图、轨迹图、时序曲线 | 图表浮层 (FloatingPanel, 可关闭) |
| `playbackActions` | 播放/暂停/重置按钮数组 | 播放浮层 (FloatingPanel) |

## 3. 新页面接入步骤

1. 实现 `XxxControls` 组件 → 传入 `controls` 槽。
2. 实现数据摘要 JSX（3~5 行关键读数）→ 传入 `dataOverlay` 槽。
3. 如有图表，实现图表组件 → 传入 `chart` 槽，配合 `chartVisible` 控制显隐。
4. 实现播放控制 actions 数组 → 传入 `playbackActions` 槽。
5. 保持分层结构：`useXxxSceneState` + `XxxControls` + `XxxRig3D` + `XxxScene` 壳层。

## 4. 最小模板

```tsx
import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { NewDemoControls } from './NewDemoControls'
import { NewDemoRig3D } from './NewDemoRig3D'
import { useNewDemoSceneState } from './useNewDemoSceneState'

export function NewDemoScene() {
  const state = useNewDemoSceneState()

  return (
    <SceneLayout
      controls={<NewDemoControls state={state} />}
      dataOverlay={
        <div className="scene-core-summary-stack">
          <p>状态: {state.running ? '运行中' : '已暂停'}</p>
          <p>核心量: {state.intensity.toFixed(1)}</p>
        </div>
      }
      chart={state.showChart ? <NewDemoChart data={state.chartData} /> : undefined}
      chartVisible={state.showChart}
      playbackActions={[
        { key: 'play', label: state.running ? '暂停' : '播放', onClick: state.toggleRunning },
        { key: 'reset', label: '重置', onClick: state.reset },
      ]}
      viewport={
        <InteractiveCanvas frameloop={state.running ? 'always' : 'demand'}>
          <NewDemoRig3D running={state.running} intensity={state.intensity} />
        </InteractiveCanvas>
      }
    />
  )
}
```

## 5. 推荐组合

- "图表 + 3D 同讲"类（示波器 / 回旋加速器）：`chart` + `dataOverlay`（波形 + 读数同时可见）
- "读数辅助 3D 观察"类（MHD / 奥斯特）：`dataOverlay`（实时数值覆盖在 3D 旁边）

## 6. 验收清单

- 侧栏展开/折叠是否正常。
- 数据浮层是否始终显示关键读数。
- 图表浮层能否正确打开/关闭。
- 播放按钮功能是否正常。
- 移动端底部面板 tab 切换是否流畅。
- 1080P 屏上，数据浮层读数是否在 2~4 米距离内可辨识。
