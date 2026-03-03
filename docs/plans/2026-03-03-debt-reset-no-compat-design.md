# 3DMotion 架构去债与去兼容化设计（激进版）

日期：2026-03-03  
作者：Codex（基于仓库现状扫描）  
约束：**不考虑向后兼容**，优先“干净、健壮、解耦、易扩展”

---

## 1. 现状基线（客观快照）

### 1.1 质量状态

- `npm run verify:ci` 本地通过（lint + 75 个测试文件 + build + 预算守卫）。
- 当前仓库不是“会炸”状态，主要问题已从可运行性转移到可维护性与扩展一致性。

### 1.2 规模概览

- `src` 生产代码约 **11529 LOC**（不含测试）。
- `src` 测试代码约 **3754 LOC**。
- `scripts` 约 **1780 LOC**。

### 1.3 复杂度热点（生产文件）

- `src/scenes/cyclotron/CyclotronScene.tsx`：581 LOC
- `src/scenes/mhd/MhdGeneratorScene.tsx`：527 LOC
- `src/scenes/electrostatic-lab/ElectrostaticLabScene.tsx`：439 LOC
- `src/scenes/electrostatic-lab/model.ts`：503 LOC
- `src/scene3d/InteractiveCanvas.tsx`：307 LOC
- `src/styles/shell.css`：836 LOC

### 1.4 历史演进与包袱来源（按提交轨迹）

- 初期：快速交付 MVP（示波器/回旋器）形成“大场景文件 + 内嵌 3D + 内嵌状态”。
- 中期：引入触控统一、导航预加载、课堂模式、分栏策略，新增跨层逻辑。
- 后期：开始偿债（`oersted` 已拆分、`SceneLayout` 缩小、样式模块化），但**不同场景演进不一致**，导致新旧架构并存。

结论：当前包袱不是“遗留废代码多”，而是“**架构代际混杂**”。

---

## 2. 技术债总览（按严重度）

## P0（结构性阻塞，继续扩展会放大债务）

1. **场景注册链路存在设计断层**
- `config/demo-scenes.json` 是目录源，但 `src/app/demoRoutes.ts` 仍依赖手工 `SCENE_LOADERS`。
- `scripts/scaffold/new-scene.mjs` 只写 JSON，不更新 `SCENE_LOADERS`。
- 结果：脚手架生成的新场景默认不可运行，属于“工具层制造债务”。

2. **场景边界不统一**
- `oersted` 已是“Scene(壳) + state hook + rig + controls”。
- `cyclotron/mhd/electrostatic-lab` 仍把业务状态、数值逻辑、3D 结构、课堂读数混在单文件中。
- 团队无法建立统一重构模板，后续维护成本线性转指数。

## P1（高成本维护债务）

1. **兼容性逻辑散落在运行时核心**
- `InteractiveCanvas` 同时承担：触控手势、指针意图守卫、WebGL 降级、自适应 framing、反馈文案。
- `simClient` 维护 worker/local 双路径，`useAppStore` 维护 storage/test 兼容路径。
- 这些逻辑提高稳定性，但显著放大认知负担。

2. **课堂策略“静态声明 + 运行时 DOM 扫描”混搭**
- `presentationSignals` 一部分来自场景静态配置，一部分靠 `data-presentation-signal` 运行时扫描。
- 优点是兜底，缺点是契约边界不纯，调试路径更长。

3. **静电场域模型碎片化**
- `equipotential` 与 `electrostatic-lab` 有并行但重叠的数据结构与 charge 操作逻辑（如 `nextChargeId` 模式重复）。
- 领域复用缺失，后续新增静电场场景会重复实现。

## P2（持续摩擦）

1. `shell.css` 仍偏大，主题/壳层/导航视觉规则耦合在同一文件簇。
2. 脚手架模板仍偏“单文件场景”，未跟上现有最佳实践（`oersted` 模式）。
3. 文档与真实实现有轻微漂移（例如 README 对 scaffold 行为描述滞后）。

---

## 3. 兼容性代价账本（以“完全不兼容”为前提评估）

以下是当前“兼容层”带来的显式复杂度（核心文件 LOC）：

- `InteractiveCanvas.tsx`（307）  
- `useResizableSplitPanel.ts`（190）  
- `simClient.ts`（178）  
- `threeConsoleFilter.ts`（131）  
- `useGlobalShortcuts.ts`（109）  
- `useAppStore.ts`（97）  
- `routeWarmupPolicy.ts`（95）  
- `usePresentationStrategy.ts`（82）  
- `check-clean-build.mjs`（84，流程兼容与临时工作区逻辑）

合计约 **1273 LOC**（未计同类测试与调用代码）。

这部分价值在于“广泛设备适配 + 异常兜底 + 课堂模式容错”。  
但在“不考虑兼容性”的目标下，它们会成为最先可裁剪的一组复杂性来源。

---

## 4. 去债方案对比（3 选 1）

## 方案 A（推荐）：**核心重构 + 激进删兼容**

做法：
- 固定目标环境：现代 Chromium 教学机 + WebGL2 + Pointer Events。
- 删除/降级多路径兼容：worker/local 双栈、复杂网络预热判定、三指模式切换等。
- 全场景统一到 `SceneShell + useSceneState + SceneRig3D + SceneControls + domain/*`。
- 以 `import.meta.glob` + 标准导出自动注册场景，移除手工 `SCENE_LOADERS`。

优点：
- 代码显著收敛，契约单一，新增场景成本可预测。
- 最符合“干净整洁、解耦、易扩展”目标。

缺点：
- 功能行为会发生明显变化（触屏与低端设备体验被牺牲）。

## 方案 B：先结构统一，后删兼容

做法：
- 先不删兼容层，只统一场景边界、注册机制、领域模块。
- 第二阶段再裁兼容逻辑。

优点：风险较低。  
缺点：过渡期复杂度最高，且容易拖成“永远第二阶段”。

## 方案 C：按场景逐个替换（增量重写）

做法：
- 每次重写一个场景，逐步引入新架构。

优点：每次改动小。  
缺点：新旧并存时间最长，治理周期最慢。

**推荐结论：选方案 A。** 既然明确“不考虑兼容性”，就应一次性切断复杂来源，避免半重构状态。

---

## 5. 目标架构（无兼容包袱）

## 5.1 场景契约统一

每个场景目录统一为：

- `index.ts`：导出 `SceneDescriptor`
- `scene.tsx`：仅做编排，不写业务公式
- `state/useXxxState.ts`：场景状态机与 action
- `domain/*.ts`：纯函数与模型
- `view/XxxRig3D.tsx`：纯 3D 呈现
- `view/XxxControls.tsx`：纯 UI 控件
- `classroom.ts`：`presentationSignals` 与 `coreSummary` 构建器

## 5.2 路由与目录收敛

- 废弃 `SCENE_LOADERS` 手工映射。
- 使用 `import.meta.glob('../scenes/**/index.ts', { eager: true })` 自动发现。
- `config/demo-scenes.json` 只保留课堂文案与排序；技术字段由场景描述符提供。

## 5.3 兼容层裁剪

- 删除 `routeWarmupPolicy` 设备判定，统一轻量预加载策略。
- 删除触屏三指模式与轮缩“意图守卫”复杂分支，保留基础 orbit 交互。
- 删除 local fallback：仿真统一 worker（失败即显式错误，不静默降级）。
- 删除 runtime signal 扫描，课堂信号只接受静态强类型声明。

## 5.4 领域模块化

- 新建 `src/domains/electrostatics`，收敛：
  - charge 集合操作
  - potential/e-field 采样
  - terrain/field-line 生成
  - 预设模板
- `equipotential` 与 `electrostatic-lab` 仅保留场景差异层。

---

## 6. 落地顺序（激进但可执行）

1. **基础切换（第 1 周）**
- 建立新 `SceneDescriptor` 协议与自动注册。
- 修复 scaffold，使其直接生成新架构目录。
- 删除 `SCENE_LOADERS` 与相关漂移测试。

2. **场景标准化（第 2-3 周）**
- 重构 `cyclotron`、`mhd`、`electrostatic-lab` 为壳层 + 状态 + rig + domain。
- 设置单文件上限（如 240 LOC）作为 lint 规则。

3. **兼容层清理（第 4 周）**
- 移除 worker/local 双路径与复杂触控模式。
- 简化 `InteractiveCanvas` 到最小职责版本。
- 收紧 `usePresentationStrategy` 为纯静态策略。

4. **领域收敛（第 5 周）**
- 合并静电场域重复逻辑。
- 建立跨场景领域测试集。

---

## 7. 验收标准（去债完成定义）

- 新增场景从脚手架生成到可运行不需手工补丁。
- 所有场景目录结构一致，`Scene` 文件仅承担编排职责。
- 关键核心模块无“双路径兼容分支”。
- 场景扩展仅需改 `scene descriptor + domain`，不触碰 app 壳层。
- `npm run verify:ci` 与 e2e 保持全绿。

---

## 8. 关键风险（激进方案特有）

- 失去低端设备/非标准环境容错。
- 触屏高级手势能力下降。
- 迁移期行为变更明显，需要统一课堂使用说明。

这些风险与本次目标一致（明确不考虑兼容性），可接受。

---

## 9. 执行建议（结论）

当前仓库已经过第一轮治理，具备“动大手术”的基础条件。  
若目标是最大化清债，最优策略不是继续补丁式改良，而是：

1. 先统一场景契约与注册链路（堵住新增债务入口）  
2. 再批量标准化大场景  
3. 最后集中删除兼容分支并做领域收敛

这条路线在 4-6 周内可把项目从“可维护”推进到“可演化”。
