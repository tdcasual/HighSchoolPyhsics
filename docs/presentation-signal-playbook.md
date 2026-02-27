# 课堂展示混合模式接入规范（新演示页面模板）

本规范用于后续新增演示页面时，统一接入“课堂展示混合模式（自动 / 双核心 / 视口优先）”。

## 1. 目标

- 让新页面在 `自动` 模式下，尽量准确判断“左侧信息区是否为课堂核心”。
- 保证误判时可通过顶部布局切换器手动覆盖。
- 保持不同页面的信号标注一致，避免后续维护漂移。

## 2. 自动识别规则

`SceneLayout` 会对信号打分：

- `chart` = 2
- `live-metric` = 1
- `time-series` = 1
- `interactive-readout` = 1

决策阈值：

- 总分 `>= 2`：自动进入 `split`（双核心并排）
- 总分 `< 2`：自动进入 `viewport`（视口优先）

注意：用户在顶部切换 `双核心` / `视口优先` 后，会覆盖自动判断并按路由记忆。

## 3. 信号语义

- `chart`: 可连续阅读趋势/波形/图表的可视核心（优先级最高）
- `time-series`: 明确的随时间变化曲线（可与 `chart` 共用）
- `live-metric`: 实时数值读数（电压、能量、频率等）
- `interactive-readout`: 互动观察结果（例如可见摆动、状态等级）

## 4. 新页面接入步骤

1. 在场景页面给 `SceneLayout` 传 `presentationSignals`（静态先验）。
2. 在左侧关键组件节点加 `data-presentation-signal`（运行时补充识别）。
3. 默认不改全局布局逻辑，由混合模式自动判断。
4. 用课堂展示开关和布局切换器做一次人工验收（自动是否合理、手动是否可兜底）。

## 5. 最小模板（可直接复制）

```tsx
import { SceneLayout } from '../../ui/layout/SceneLayout'

export function NewDemoScene() {
  return (
    <SceneLayout
      presentationSignals={['chart', 'live-metric']}
      controls={
        <>
          <h2>新演示控制</h2>

          <div data-presentation-signal="chart time-series">
            {/* 图表组件 */}
          </div>

          <div data-presentation-signal="live-metric">
            {/* 实时读数 */}
          </div>
        </>
      }
      viewport={
        <>{/* 3D 视口 */}</>
      }
    />
  )
}
```

## 6. 推荐组合

- “图表 + 3D 同讲”类（示波器 / 回旋加速器）：`chart` + `live-metric`（通常自动进 `split`）
- “读数辅助 3D 观察”类（MHD / 奥斯特）：`live-metric` 或 `interactive-readout`（通常自动进 `viewport`）

## 7. 验收清单

- 开启“课堂展示”后，布局是否符合课堂预期。
- 切换到 `自动` / `双核心` / `视口优先` 时，行为是否即时生效。
- 刷新页面后，该路由的手动选择是否被记忆。
- 1080P 屏上，核心信息是否在 2~4 米距离内可辨识。
