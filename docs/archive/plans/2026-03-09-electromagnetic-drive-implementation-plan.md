# Electromagnetic Drive Implementation Plan

**Goal:** 新增 `electromagnetic-drive` 场景，在项目统一的 `SceneLayout` 中复刻外部离线页《观察电磁驱动现象》核心内容：木质实验架、旋转磁铁、异步跟随的铝框、开始/停止/重置操作，以及实时转速对比图；同时满足课堂模式摘要、`presentationSignals`、触屏与 1080P 可读性约束。

**Source parity targets:**

- 3D 几何关系优先按原页参数移植：底座、双立柱、横梁、悬挂磁铁、曲柄、铝框、支点。
- 运动逻辑与原页一致：磁铁一阶趋近目标转速，铝框以“滑差耦合 + 摩擦 + 惯量”方式缓慢跟随。
- 控制动作与原页一致：开始仅置 `isRunning=true`，停止只令磁铁减速，重置归零并清空图表。
- 图表语义一致：两条曲线分别表示“磁铁转速 / 铝框转速”，有滚动窗口。

**Project adaptation rules:**

- 控制台与主题配色遵循项目样式，不复制原页整套 sidebar 皮肤。
- `SceneLayout` 必须声明 `presentationSignals`，并提供 4 行 `coreSummary`。
- 关键读数块与图表块必须带 `data-presentation-signal`。

## Files

- Create `src/scenes/electromagnetic-drive/ElectromagneticDriveScene.tsx`
- Create `src/scenes/electromagnetic-drive/ElectromagneticDriveControls.tsx`
- Create `src/scenes/electromagnetic-drive/ElectromagneticDriveRig3D.tsx`
- Create `src/scenes/electromagnetic-drive/ElectromagneticDriveChart.tsx`
- Create `src/scenes/electromagnetic-drive/useElectromagneticDriveSceneState.ts`
- Create `src/scenes/electromagnetic-drive/model.ts`
- Create `src/scenes/electromagnetic-drive/model.test.ts`
- Create `src/scenes/electromagnetic-drive/electromagnetic-drive.css`
- Create `src/scenes/electromagnetic-drive/__tests__/structure.test.tsx`
- Create `src/scenes/electromagnetic-drive/__tests__/classroomMode.test.tsx`
- Update `config/demo-scenes.json`
- Update `src/scenes/__tests__/sceneSwitching.test.tsx`

## TDD tasks

### Task 1: 纯模型与格式化

先写 `src/scenes/electromagnetic-drive/model.test.ts`，覆盖：

- 初始状态两转速、两角度均为 0
- running 状态下磁铁转速逐帧逼近目标值
- 铝框转速始终滞后于磁铁
- stop 后磁铁减速，铝框靠惯性继续变化后回落
- reset 会清空图表历史与角度

然后实现 `model.ts` 的纯函数：

- `stepElectromagneticDriveState`
- `resetElectromagneticDriveState`
- `formatAngularSpeed`
- `formatLagRatio`

### Task 2: 状态 hook

先写结构/状态可见性测试需要的失败断言，再实现 `useElectromagneticDriveSceneState.ts`：

- 内部维护 `running`、`magnetSpeed`、`frameSpeed`、`magnetAngle`、`frameAngle`
- 用 `requestAnimationFrame` 驱动逐帧更新
- 每隔固定采样帧写入图表数组，最多保留滚动窗口
- 暴露 `start / pause / reset`

### Task 3: 场景与课堂模式接入

先写失败测试，确认：

- 页面渲染标题“电磁驱动控制”
- 渲染“开始摇动 / 停止摇动 / 重置实验”按钮
- 渲染“实时转速对比”图表标题
- 课堂模式下摘要仍可见，且图表/读数节点暴露 `data-presentation-signal`

然后实现：

- `ElectromagneticDriveRig3D.tsx` 复刻原页几何和相机构图
- `ElectromagneticDriveChart.tsx` 用 SVG 实现双曲线滚动图，避免额外依赖
- `ElectromagneticDriveScene.tsx` 用 `SceneLayout` 组装控制区与视口
- `config/demo-scenes.json` 注册新路由和课堂契约

## Validation

按最小到整体顺序执行：

```bash
npm test -- src/scenes/electromagnetic-drive/model.test.ts
npm test -- src/scenes/electromagnetic-drive/__tests__/structure.test.tsx src/scenes/electromagnetic-drive/__tests__/classroomMode.test.tsx
npm test -- src/scenes/__tests__/sceneSwitching.test.tsx src/app/__tests__/demoRouteConformance.test.ts
npm run lint
npm run build
```

若时间允许，再做一次本地视觉烟测，对比原始 HTML 的实验构图与动态节奏。
