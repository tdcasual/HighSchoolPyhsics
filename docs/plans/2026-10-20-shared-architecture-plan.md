# 共享架构改进计划（2026-10-20）

状态：已完成（2026-10-20），见文末「完成情况」。全部工作只做本地提交，不推送（见 `hold-pushes` 约定）。

## 0. 现状盘点（基于 27 个场景的实测）

| 共享设施 | 已有 | 实际采用 | 缺口 |
|---|---|---|---|
| 仿真时钟 `useSimulationClock` 等 | `src/simulation/` | 18/27 场景 | 示波器仍走旧的 `core/useParticleSimulation` + worker，靠 `stepOffsetS` 补单步 |
| 播放区 `clockActions` | `simulation/clockActions.ts` | **0/27** | 19 个场景手写 `playbackActions={[...]}`，按钮文案、键名、重置语义各不相同 |
| 图表 `ui/charts/LineChart` | 93 行 | **0/16** | 16 个图表手写，共约 2150 行（12 个 SVG、4 个 canvas），坐标轴、刻度、游标、大字号、预测遮罩各写一遍 |
| 取景 `useFittedOrbitCamera` | `scene3d/` | 4/27 | 13 个场景用字面量 `camera={{ position }}`；5 个场景按 `MOBILE_BREAKPOINT` 分支取景（违反规则 5）；天体运动自建 `celestialCamera` 并关闭 `adaptiveFraming` |
| 分层结构 state/Controls/Rig/Scene | 规则 12 | 23/27 | electrostatic-lab、equipotential、potential-energy、oscilloscope 没有 state hook；示波器也没有 Controls/Rig |
| 数据面板 `DataRows` | ✔ | 27/27 | 万用表两个阶段显示 8 行（超过 5 行） |
| 场景记忆 | ✔ | 24/27 | 约定测试已覆盖 |
| 领域库 | `domains/electrostatics`（2 个场景用） | — | 光学 4 个场景（双缝、光的衍射、劈尖、衍射）与电磁感应 5 个场景各自重复模型和绘制代码 |
| 注册 | `demo-scenes.json` + `sceneNavigation.ts` | — | json 共 738 行，27 个 `touchProfile` 完全相同 |
| 浏览器回归 | interaction、visual | — | 另有 8 个按场景的 `*-audit.mjs` 不在任何流水线中，可能已过时 |

结论：上一轮把这些设施**建好了**，但多数场景还没真正用上。本计划的重点是**让场景迁移上去，并用约定测试锁住**，不再新造抽象。

## 1. 原则

1. **先迁移，再抽象。** 新的共享 API 只在已有 ≥3 个场景需要时才提取，而且以迁移第一个场景来驱动设计。
2. **每一项都配一条约定测试**（`sceneConventions.test.ts`），附带豁免表和豁免理由；豁免表只减不增。
3. **行为不变。** 每个场景迁移前后：视觉基线差异在容差内，`test:interaction -- <id>` 通过，单元测试通过。有意改变的行为要单独提交并说明。
4. **小步提交。** 一个阶段内每 2–4 个场景提交一次，提交信息写清迁移了哪些场景。
5. **度量可见。** 先做一个采用率报告脚本，每个阶段结束时更新上面的表格。

## 2. 阶段

### 阶段 A：度量与门禁（前置，约 1 次提交）

- 新增 `scripts/ci/architecture-report.mjs`：逐场景列出时钟、clockActions、图表库、取景、分层、行数、测试数，输出 Markdown 表，接入 `npm run report:architecture`。
- 清点 8 个 `*-audit.mjs`：能并入 `interaction-regression` 的断言并入，过时的删除，保留下来的写进 `verify:full`。
- 验收：报告能复现第 0 节的数字；`verify:full` 覆盖所有保留的浏览器脚本。

### 阶段 B：播放区统一（约 4 次提交）

- 扩展 `clockActions`，用来吸收现有差异，而不是让场景继续绕开它：
  - `finished` 时显示「再演示」；
  - 可选的 `step-back`；
  - 播放与暂停的自定义文案（如「继续扫描」）。
  - 再加一个给不走时钟的状态机场景用的 `stateActions({ running, toggle, step, reset })`，统一键名与文案顺序。
- 迁移 19 个手写场景。
- 示波器：把 `useParticleSimulation` 换成 `useSimulationClock`，去掉 `stepOffsetS`。之后若 `core/useParticleSimulation`、`core/simController`、`workers/` 不再有调用者就删除（`core/integrators` 仍被回旋加速器使用，保留）。
- 顺带处理 3D 示波器：结构认知模式默认暂停，或改按钮文案，解决“显示播放中但画面不动”的问题，并把它移出 `STILL_WHILE_PLAYING`。
- 约定测试：场景文件里不允许出现 `playbackActions={[` 字面量；豁免只给 instrument 练习类（游标卡尺、螺旋测微器，它们的按钮是练习流程），要写明理由。
- 验收：报告中 clockActions 或 stateActions 覆盖率达到 27/27（扣除豁免）；交互回归通过；`core/` 与 `workers/` 中的死代码已删除。

### 阶段 C：图表库（约 5 次提交，收益最大）

- 先盘点 16 个图表的共性：坐标轴、刻度、单位、当前时刻游标、多系列图例、答案标记（用 `usePredictionMasked`）、大字号缩放、昼夜主题色。
- 把 `ui/charts/` 扩成小型图表套件：
  - `LineChart`：在现有基础上补充图例、参考线、散点或标记点，以及 `answer` 系列（预测模式下隐藏）。
  - `ChartFrame`：标题、坐标轴与刻度的 SVG 外框，供特殊图（相位图、轨迹图）复用。
  - `IntensityProfile`：canvas 强度分布曲线，服务光学 4 个场景，内置 DPR 处理和自适应分辨率。这样也能消除 `RAW_FRAME_LOOPS` 中的两个豁免。
- 迁移顺序从简单到复杂：
  1. 简单折线：wave-state、orthogonal-em-wave、generator-core、oscilloscope-3d、ideal-gas；
  2. 带游标或多系列：celestial、cyclotron、resistivity、multimeter、cart、electromagnetic-drive、ticker-timer；
  3. 光学 canvas：wave-interference、wedge、double-slit、light-diffraction。
- 约定测试：`*Chart.tsx` 必须从 `ui/charts/` 引入；禁止在 Chart 文件里直接调用 `getContext('2d')`。
- 验收：图表代码总行数减少约 40%（目标 2150 行降到 1300 行以下）；视觉基线在容差内；大字号和夜间模式在 1366×768 与 1920×1080 下截图检查通过。

### 阶段 D：取景全部走共享相机（约 4 次提交）

- 为每个固定相机的场景给出装置包围盒（`bounds(...)`），改用 `useFittedOrbitCamera`。共 13 个场景：electromagnetic-drive、electrostatic-lab、orthogonal-em-wave、equipotential、oscilloscope（CRT）、generator-core、oscilloscope-3d、mhd、potential-energy、ticker-timer、ideal-gas、induction-current、cart-velocity。
- 删掉 5 处 `MOBILE_BREAKPOINT` 相机分支，交给安全区处理。
- 天体运动：`celestialCamera` 改为以球形包围盒交给 `fitOrbitView`，去掉 `adaptiveFraming={false}` 和自管的 `useViewportSize`。
- 如果某个场景需要“固定视角、不自动适配”（例如强调某个观察方向），由 `useFittedOrbitCamera` 的 `ViewPreset` 表达，不再写字面量相机。
- 约定测试：场景文件中禁止出现 `camera={{ position` 与 `MOBILE_BREAKPOINT`（可豁免，但要写理由）。
- 验收：在 1366×768、1920×1080、手机 390×844 三种尺寸下，每个场景的装置完整、居中于空闲区。这部分由 interaction 回归新增断言：装置投影包围盒全部落在 canvas 内且不被面板遮挡。

### 阶段 E：分层结构补齐（约 2 次提交）

- 给 electrostatic-lab、equipotential、potential-energy 补上 `useXxxSceneState`，示波器补全 state/Controls/Rig 四层。示波器的场景文件现为 207 行，控件全部内联。
- 约定测试：每个场景目录都必须有 `use*SceneState.ts`、`*Controls.tsx`、`*Scene.tsx`；Rig 可以叫 `*Rig3D.tsx` 或 `*Assembly.tsx`（万用表）。
- 验收：报告中分层覆盖率 27/27。

### 阶段 F：领域库（约 4 次提交，需先盘点）

- 用 jscpd 或手工比对，盘点光学和电磁感应两组场景的重复代码。只提取确有重复的部分：
  - `domains/wave-optics/`：波长与颜色映射、单缝和双缝强度函数、白光叠加、屏幕纹理绘制（通用的 `usePaintedTexture` 从 `instruments/measuring` 上移到 `scene3d/`）。
  - `domains/electromagnetism/`：磁通量与感应电动势、右手定则箭头、磁铁、线圈和导轨的 3D 部件、电流方向动画。
- 验收：两组场景的模型测试迁到领域库，场景内只剩参数与组合；领域库各自配有单元测试。

### 阶段 G：注册与契约测试（约 3 次提交）

- `demo-scenes.json` 中省略与默认值相同的 `touchProfile`，由 `defaultTouchProfile` 补齐，预计 json 从 738 行降到约 300 行。schema 校验保留。
- 新增**通用场景契约测试** `scenes/__tests__/sceneContract.test.tsx`：从目录遍历全部场景，各自渲染一次并检查：
  - 有数据区，并且每个模式下显示的行数 ≤5；
  - 有单步的场景，单步后数据发生变化；
  - 重置后恢复初值；
  - 改动一个参数后重新挂载，参数被记住；
  - 预测模式下 `answer` 行被遮罩。
- 这一步会暴露万用表 8 行的问题：本阶段请老师决定删哪些行，或者拆成两个模式。
- 验收：契约测试覆盖 27/27，场景各自的结构测试中与之重复的部分删除。

### 阶段 H：文档与脚手架同步（每个阶段末尾顺带做）

- AGENTS.md 规则、模板、脚手架模板与约定测试保持一致。脚手架生成的场景必须直接通过所有约定测试和契约测试，脚手架测试中对此加断言。

## 3. 顺序与依赖

```
A 度量 ─┬─> B 播放区 ──> E 分层 ──> G 契约测试
        ├─> C 图表库 ──> F 领域库（光学部分依赖 IntensityProfile）
        └─> D 取景
H 贯穿各阶段
```

建议执行顺序：A → B → C → D → E → G → F。

- B 和 C 的收益最直接，风险最低。
- D 牵涉每个场景的视觉基线，放在图表之后集中更新一次。
- F 依赖前面阶段清理后的代码，最后做。

## 4. 每个阶段的完成标准

- `npm run verify:ci` 通过，包括 lint、行数检查、单元测试、构建、首页预加载和体积预算。
- `CHROME_PATH=/usr/bin/google-chrome npm run test:interaction` 全部通过。
- `npm run test:visual-smoke` 通过；有意的视觉变化先人工确认，再用 `-- <pageId>` 更新基线。
- 入口体积不超过预算（JS 32 kB、CSS 60 kB），场景 chunk 不增大超过 5%。
- 更新 `docs/audit/2026-10-17-cross-scene-audit.md`，追加一轮记录，并更新第 0 节表格。

## 5. 风险

| 风险 | 对策 |
|---|---|
| 迁移改变了画面或时间行为（如时钟 dt 上限、相机距离） | 迁移前补充针对该场景的数值测试；视觉基线逐场景对比 |
| 图表库为迁就特殊图而膨胀 | 特殊图只复用 `ChartFrame`，绘制部分留在场景内 |
| 光学 canvas 性能退化（自适应分辨率逻辑复杂） | `IntensityProfile` 照搬 double-slit 现有的自适应策略并保留其测试；迁移后用性能脚本对比 |
| 取景自动化后某些场景失去刻意设计的观察角 | 用 `ViewPreset` 保留原始方位角与仰角，只把距离交给自动适配 |
| 本地分支长期不推送，CI 的 interaction 作业从未实际运行过 | 每个阶段末尾在本地以 preview 模式完整运行；等你同意推送时，首次 CI 结果重点检查 |

## 完成情况（2026-10-20）

`npm run report:architecture` 结果（clock 只计有时间演化的场景；playback 不计 5 个按需求手写按钮的场景和 8 个没有播放区的静态场景）：

| 共享设施 | 开始 | 完成 |
|---|---|---|
| 播放区 `clockActions` | 0/27 | 所有有播放/暂停的场景（14 个），另 5 个有约定测试登记的理由 |
| 图表库 `ui/charts` | 0/16 | 16/16；图表代码 2152 → 1205 行，全部跟随夜间模式 |
| 共享取景 | 4/27 | 27/27（`FittedCanvas` 或 `useFittedOrbitCamera`），无设备分支 |
| 分层结构 | 23/27 | 27/27 |
| 场景代码总行数 | 28523 | 25999 |
| 约定测试 | 7 条 | 14 条，另有覆盖 27 个场景的契约测试（108 项） |

各阶段提交：A `7251ffa`，B `59365eb`，C `b6ed689`，D `f436e5f`，E `91b9a2b`，G `4a1cd61`，F `19a1977`、`b2fb218`。

与计划的差异：
- 阶段 F 只建了光学领域库。按第 1 节「先迁移再抽象」，逐窗口比对后电磁感应各场景之间几乎没有重复代码，没有建电磁学库。
- 多用电表 8 行的问题没有等待单独决定：按「结果而非参数回显、给出已知」的约定精简为 5 行和 4 行，结论设为可预测。如需保留某行，可以再调整。
- 统一后的滤光片参数让双缝干涉和光的衍射在白光加滤光片时的显示略有变化（红 650±30 nm 等）。

## 6. 不在本计划内

- 不增加新场景，也不恢复已删除的场景。
- 不改预测模式的适用范围，不做三步引导读数。
- 不重写 git 历史（`86d464a` 单独无法构建的问题不处理，只在文档中记录）。
