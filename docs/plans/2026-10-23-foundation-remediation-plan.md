# 基础组件修复计划（2026-10-23）

状态：已完成（2026-10-23），见文末「完成情况」。来源：2026-10-23 架构与基础组件审计（综合 8.2/10）。全部工作只做本地提交，不推送（见 `hold-pushes` 约定）。

## 0. 审计结论与目标

| 维度 | 现分 | 目标 | 本计划对应阶段 |
|---|:-:|:-:|---|
| 约定的自动化执行 | 9.5 | 9.5 | 各阶段都补约定测试 |
| 分层与模块边界 | 9.0 | 9.0 | — |
| 状态管理 | 8.5 | 9.0 | 阶段 5 |
| 基础组件 API | 8.5 | 9.0 | 阶段 5 |
| 组件采用一致性 | 8.0 | 9.0 | 阶段 2、3 |
| 时间与仿真层 | 8.0 | 8.5 | 阶段 4 |
| 3D 取景与渲染栈 | 8.0 | 8.5 | 阶段 7 |
| 基础层测试 | 8.0 | 8.5 | 阶段 7、8 |
| 类型与代码规范 | 7.5 | 9.0 | 阶段 1 |
| 领域层 | 7.0 | 8.0 | 阶段 3 |
| 样式体系 | 6.5 | 8.0 | 阶段 2、6 |

目标综合分约 8.8。

## 1. 原则（沿用 2026-10-20 计划）

1. **先迁移，再抽象。** 只有已有 3 个及以上使用者时才提取共享件，并以迁移第一个使用者来驱动 API 设计。
2. **每项配一条约定测试**（`src/scenes/__tests__/sceneConventions.test.ts`），附豁免表和理由，豁免表只减不增。
3. **行为不变。** 每次提交前后：单元测试通过；受影响场景的 `test:interaction -- <id>` 通过；三套视觉基线（白天、夜间、手机）在容差内，数据面板严格比对不变。有意的视觉变化单独提交、说明原因并更新基线。
4. **小步提交。** 每次提交只做一件事，提交信息写清涉及的场景。
5. **每阶段末尾**：跑 `verify:ci`，更新本文「完成情况」，必要时同步 AGENTS.md 和脚手架。

## 2. 阶段

### 阶段 1：代码格式统一（1–2 次提交）

现状：没有格式化工具；11 个文件用双引号 import；`WaveStateRig3D.tsx` 写成压缩风格。

- 加入 Prettier（devDependency，版本锁定）。配置贴合现有主流风格：单引号、无分号、`printWidth` 按现有代码实测决定（先跑 `--check` 统计改动量，选改动最少的值）。
- 新增 `npm run format`、`npm run format:check`，把 `format:check` 接入 `verify:ci`。
- 单独一次提交「纯格式化」，把它的哈希写进 `.git-blame-ignore-revs`。
- 检查 eslint 与 Prettier 规则是否冲突（必要时加 `eslint-config-prettier`）。

验收：`format:check` 通过；纯格式化提交后所有测试和视觉基线不变。

### 阶段 2：3D 标签全部收口到 `SceneLabel`（2–3 次提交）

现状：AGENTS.md 规定 3D 文字都用 `SceneLabel`，但有 6 个文件直接用 drei 的 `Html` 加行内样式或自带 CSS：

| 文件 | 用途 | 问题 |
|---|---|---|
| `instruments/measuring/CaliperAssembly.tsx`、`MicrometerAssembly.tsx` | 部件名（`PartLabel`） | 自带 `measure-3d-label` CSS |
| `scenes/motional-emf/MotionalEmfRig3D.tsx` | 端点 A/B | 自带 `motional-emf-end-label` CSS |
| `scenes/ticker-timer/ElectromagneticTimer.tsx` | 部件名 | 行内样式 |
| `scenes/resistivity/CircuitAssembly.tsx` | 电表量程、米尺刻度数字 | 行内颜色，夜间不跟随主题 |
| `scenes/wave-interference/WaveInterferenceRig3D.tsx` | 波源、O 点 | 白色描边写死，夜间不跟随主题 |

另有 6 个场景在本地包一层 `Label`/`PartLabel`（generator-core、light-diffraction、wedge-interference、double-slit、oscilloscope-3d、ticker-timer），只是在固定 `SceneLabel` 的参数。

- 按需扩展 `SceneLabel`：刻度数字这类小号无底色文字可能需要一个新 variant（例如 `scale`），先迁移米尺来确定样式。
- 迁移上表 6 个文件，删除 `measure-3d-label`、`motional-emf-end-label` 等 CSS。
- 本地包装：只固定参数的直接改为调用 `SceneLabel`；确有复用价值的保留，但必须只包 `SceneLabel`。
- 约定测试：`src/scenes`、`src/instruments`、`src/domains` 下禁止从 `@react-three/drei` 引入 `Html`（`SceneLabel.tsx`、`ProjectionOffset.tsx` 除外）。

验收：约定测试通过；夜间基线中这些标签随主题变化（预期的视觉变化，单独提交并更新夜间基线）。

### 阶段 3：共享 3D 部件与电磁学领域层（3–5 次提交，先盘点）

**3a. 共享箭头 `scene3d/Arrow3D`**：现有 5 份实现，参数各异：

- `motional-emf` 的 `Arrow3D`（anchor + direction + length，实心圆柱）
- `generator-core` 的 `Arrow`（start/end，线 + 锥）
- `rotational-emf` 的 `FieldArrow`（实心）
- `cyclotron` 的 `FieldArrow`（实心，半透明）
- `wave-state` 的 `Arrow`（线 + 锥）

设计一个组件，用 `from`/`to`（或 `origin` + `vector`）定位，`style: 'solid' | 'line'`，可选 `opacity`、头部尺寸；零长度时不渲染。以 `motional-emf` 先行迁移，再迁移其余 4 个。约定测试：场景中禁止再定义名字以 `Arrow` 结尾的组件。

**3b. 盘点后建立 `src/domains/electromagnetism/`**：涉及导体棒切割、旋转切割、感应电流、电磁驱动、发电机、回旋加速器、磁流体这 7 个场景，以及打点计时器的电磁部分。

- 先出一张盘点表：匀强磁场箭头阵列、磁铁（N/S 极）、线圈、接线柱（`resistivity`、`multimeter`、`ticker-timer` 各一份）、电流方向标记、电动势与洛伦兹力的公式函数，逐项写明使用者数量。
- 只提取使用者达到 3 个的部件或函数。接线柱等通用电学部件如果主要被仪器场景使用，放 `src/instruments/` 而不是领域层。
- 迁移后在 AGENTS.md 的 References 补一条。

验收：盘点表写进本文；提取的每个部件至少 3 个使用者；视觉基线不变。

**盘点结果（2026-10-23）**

| 候选 | 使用者 | 结论 |
|---|---|---|
| 匀强场箭头阵列 | motional-emf、rotational-emf、cyclotron、generator-core、mhd（5） | 提取为 `domains/electromagnetism/UniformField` + `fieldGrid` |
| 单个矢量箭头 | 9 个场景 | 已在 3a 提取为 `scene3d/Arrow3D`（通用，不属于电磁学） |
| 接线柱 | resistivity、multimeter、ticker-timer（3） | 不提取：尺寸、材质各随所在仪器（台式电路、表盘、计时器），合并会改变外观，参数比实现还多 |
| 磁铁 | generator-core（平板 N/S）、ticker-timer（U 形）、induction-current（条形）、electromagnetic-drive（蹄形） | 不提取：形状各不相同；N/S 标注已统一为 `SceneLabel` 的 badge |
| 电动势、洛伦兹力公式 | 各场景模型 | 不提取：每个场景只算自己的量（BLv、½Bωl²、NBSω、qvB），没有重复实现 |

### 阶段 4：时间推进收口（2 次提交）

现状：有 4 种推进方式（`useSimulationClock`、`useAnimatedState`、`useAnimationLoop`、`useFixedStepper`）；`useFixedStepper` 只有打点计时器使用；电势能场景的旋转扫出在 `useFrame` 中按 `delta` 自行推进，不受暂停和慢放控制，并用 `performance.now()` 节流。

- 电势能场景的扫出改由 `useSimulationClock` 推进（`advance(dt)` 返回扫完与否），这样也能单步。
- 评估把 `useFixedStepper` 并入 `useSimulationClock` 的固定子步：若打点计时器能直接改用时钟，就删掉它；否则在其文件头写明它存在的理由。
- AGENTS.md 规则 8 加一张「选哪种」的表：有播放、暂停、单步的过程用 `useSimulationClock`；状态机自己持有 `running` 时用 `useAnimatedState`；只在交互期间持续推进（拖动、按住）时用 `useAnimationLoop`。
- 约定测试：场景里调用 `useFrame` 的文件列入白名单并写理由（目前 5 个：wave-interference、mhd 粒子、celestial-motion、potential-energy、wedge-interference）；白名单只用于纯视觉动画，不得推进教学状态。

验收：电势能场景暂停后扫出停止，单步可用；交互回归通过。

### 阶段 5：`SceneLayout` 拆分与 API 收紧（3 次提交）

现状：453 行、14 个 prop；移动端播放按钮（含回调函数）经全局 store 中转（`SceneLayout` 写入，`App.tsx` 读取）。

只服务个别场景的 prop：

| prop | 使用者 | 处理 |
|---|---|---|
| `playbackControls` | ticker-timer | 改为 `clockActions` 的 `extra` 或新增的声明式选项，然后删除这个 prop |
| `overlayZIndex` | multimeter | 先查清原因（可能是表盘与面板重叠），在布局层修好后删除 |
| `chartContentClassName` | micrometer、vernier-caliper、resistivity | 改成语义化选项（例如 `chartVariant="figure"`） |
| `dataInitiallyCollapsed` | 无场景使用 | 删除 |

- 把 `SceneLayout` 拆成 `DesktopSceneLayout`、`MobileSceneLayout` 两个子组件，加上 `usePlaybackShortcuts`（键盘映射）和 `useSceneShellSync`（与 store 同步）两个 hook。对外 API 不变（除上表删除的 prop）。
- 移动端播放按钮改由 React context 传递，store 只保留可序列化的状态。
- 补 `SceneLayout` 单元测试：桌面与移动分支、快捷键映射、预测遮罩。

验收：`SceneLayout.tsx` 不超过 200 行；`sceneContract.test.tsx` 全部通过；三套基线不变。

### 阶段 6：样式拆分（2 次提交）

现状：`src/styles/shell.css` 1376 行；cart-velocity、ticker-timer 等场景自带 CSS。

- 按现有分节注释拆成 `shell/app.css`、`shell/panels.css`（浮动面板与侧栏）、`shell/forms.css`（表单、滑块、分段控件）、`shell/modes.css`（讲解、预测、大字）、`shell/mobile.css`，由 `shell.css` 依次 `@import`，层叠顺序不变。
- 拆分时用旧的 stage C 剪枝脚本检查是否有遗漏的选择器，尤其是 `.theme-night` 规则（上次误删过）。
- 场景 CSS 中凡是重复外壳已有样式的规则，改用外壳类名；保留的写明理由。
- 约定测试：场景 CSS 中不得出现写死的颜色值，必须用 `var(--…)`（可设豁免表）。

验收：三套视觉基线与数据面板严格比对全部不变（纯重构）。

### 阶段 7：取景栈简化（2 次提交）

现状：`orbitFraming` → `useBoundsFraming` → `useFittedOrbitCamera` → `useAutoFittedCamera` → `FittedCanvas` 共 5 层，周边还有 `freeRects`、`useOverlayObstacles`、`ProjectionOffset`、`presentationCamera`、`CameraSynchronizer`/`cameraSync`、`useViewportSize`。

- 把只有一个使用者的 `useBoundsFraming` 合入 `useFittedOrbitCamera`。
- 在 `src/scene3d/README.md` 写一张分层图：哪一层给场景用（`FittedCanvas`、`useFittedOrbitCamera`），哪些是内部实现。
- 补测试：`orbitFraming`（极端长宽比、包围盒退化为点或平面）、`freeRects`（面板全收起、面板占满）。

验收：场景引用的取景 API 只剩两个入口；新增测试覆盖上述边界情况。

### 阶段 8：基础层测试补齐（1–2 次提交，可与前面各阶段穿插）

- `simulation`：`useAnimatedState`、`useAnimationLoop` 各补一个测试（暂停、恢复、结束）。
- `scene3d`：`FitBounds`（`NO_FIT` 排除）、`SceneLabel` 各 variant、新增的 `Arrow3D`。
- 目标：`scene3d` 和 `simulation` 中每个被场景直接引用的模块都至少有一个测试。

## 3. 顺序与依赖

```
1 格式 ──► 2 标签 ──► 3 部件与领域层
       └─► 4 时间
       └─► 5 SceneLayout ──► 6 样式
       └─► 7 取景
8 测试：穿插在 3、4、5、7 中
```

- 阶段 1 必须最先做，否则后面每次提交都会混入格式噪音。
- 阶段 6 在阶段 5 之后，因为布局拆分会移动部分 CSS 类名。
- 2、4、5、7 互不依赖，可以按任意顺序做。

## 4. 每阶段完成标准

1. `verify:ci` 通过（含新增的 `format:check`）。
2. 受影响场景的 `test:interaction -- <id>` 和 axe 扫描通过。
3. `test:visual-smoke` 三套全部通过；有意的视觉变化已单独提交并更新基线。
4. `report:architecture` 数字更新到本文。
5. AGENTS.md 与 `scaffold:scene` 模板同步。

## 5. 风险

- **格式化大提交**会干扰 `git blame`，用 `.git-blame-ignore-revs` 缓解；它和其它改动分开提交，便于回退。
- **标签迁移改变夜间外观**：属预期，但要逐张看夜间差异图，确认是“变正确”而不是“变坏”。
- **`SceneLayout` 拆分**牵动全部 27 个场景，靠契约测试和三套基线兜底；移动端播放按钮改走 context 后，要重点跑手机交互回归。
- **CSS 拆分的层叠顺序**：`@import` 顺序必须与原文件顺序一致，数据面板严格比对是主要防线。
- **fiber 版本锁定**（`~9.5.0`）不在本计划内调整。

## 6. 不在本计划内

- 推送：等用户明确同意。
- 新增场景或改变教学内容。
- 依赖大版本升级（React 19.3、fiber 9.8 及以上），见 AGENTS.md「Dependency Pins」。

## 完成情况（2026-10-23）

| 阶段 | 提交 | 结果 |
|---|---|---|
| 1 格式统一 | 7e0282c、4a347d9、11acbd2、98643c1 | Prettier 3.6.2（单引号、无分号、120 列），`format:check` 进 `verify:ci`；纯格式化提交登记在 `.git-blame-ignore-revs`。格式化后万用表、电阻率两个场景外壳超出 240 行预算，先把各阶段的数据面板拆成独立组件 |
| 2 标签收口 | cbce828、0c022ba | 6 个文件的手写 `Html` 全部改用 `SceneLabel`（新增 `badge` 变体，用于 N/S 和端点 A/B），6 个本地包装内联，删除 3 组标签 CSS；约定测试禁止在场景、仪器、领域层直接用 `Html`。另修发电机核心模型和 3D 示波器：标签随距离缩小到几像素，改为恒定 13 px，白天用浅色描边 |
| 3 共享部件 | f948dbf、3001541 | `scene3d/Arrow3D`（几何部分是有测试的纯函数）替换 9 个场景中的手工箭头；`domains/electromagnetism/UniformField` + `fieldGrid` 由 5 个场景共用。盘点结果见阶段 3b：接线柱、磁铁、公式不提取。截图差异都在 0.1% 以内 |
| 4 时间推进 | 94dc929、2f086d4 | 电势能扫出改走共享时钟（可暂停、单步 15°、慢放），去掉两项豁免；`runFixedSteps` 统一固定子步，删除 `useFixedStepper`；AGENTS.md 规则 8 加上选型表；`useFrame` 白名单 4 项，各写明画的是什么 |
| 5 SceneLayout | 237f5d0 | 453 → 148 行，拆为桌面、移动布局和 3 个 hook；手机端播放按钮改为 portal 到页头，store 不再存函数，去掉 eslint 豁免；删除 `playbackControls`（打点计时器的速度滑块移到侧栏）、`overlayZIndex`、`dataInitiallyCollapsed`，`chartContentClassName` 改为 `chartVariant="figure"`；新增手机布局测试 |
| 6 样式 | 575dbe3、ca0b604 | `shell.css` 按区域拆成 9 个文件，构建产物 CSS 逐字节相同；场景 CSS 中的颜色全部改为令牌或具名变量（并给出夜间值），新增 `--readout-ok` / `--readout-warn`；约定测试从磁盘读取 CSS 检查（Vitest 里 `?raw` 导入的 CSS 是空字符串） |
| 7 取景 | 36b33a7 | `useBoundsFraming` 并入 `useFittedOrbitCamera`；`boxAround`、`directionFrom` 移到 `orbitFraming`；新增 `src/scene3d/README.md` 分层图；约定测试限定场景只能用公开入口；补充边界测试 |
| 8 测试 | dc02220 | 补测 `useAnimationLoop`、`useAnimatedState`、`measureBounds`（从 FitBounds 拆出）、`SceneLabel`、`useSceneTheme`；单元测试从 865 增至 896 |

关键数字：

| 指标 | 之前 | 之后 |
|---|---:|---:|
| `SceneLayout.tsx` 行数 | 453 | 148 |
| `shell.css` 最大单文件行数 | 1393 | 约 300（9 个文件） |
| eslint 豁免 | 4 | 3 |
| 约定测试条数 | 14 | 19 |
| `scene3d` / `simulation` 测试文件 | 5 / 2 | 10 / 4 |
| 场景内手写箭头实现 | 9 | 0 |
| 场景直接使用 `Html` 的文件 | 6 | 0 |
| 场景 CSS 中未命名的颜色 | 50 | 0 |
| 单元测试 | 865 | 896 |

每个阶段都通过了 `verify:ci`、受影响场景的交互回归和三套视觉回归；有意的视觉变化（标签、手机播放按钮、打点计时器速度滑块位置、样式令牌）均已单独提交并更新基线。
