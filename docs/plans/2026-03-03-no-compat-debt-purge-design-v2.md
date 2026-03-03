# 3DMotion 架构去债与去兼容化设计（V2）

日期：2026-03-03  
作者：Codex  
适用范围：`/Users/lvxiaoer/Documents/3dmotion` 主仓库  
策略前提：**不考虑向后兼容**，优先实现“干净、健壮、解耦、易扩展”

---

## 1. 背景与问题定义

本项目已经完成第一轮治理，具备稳定可运行状态，但仍存在明显代际混杂：

1. 场景层大部分已进入“壳层化”方向，仍有个别重场景残留历史结构。
2. 兼容性代码（设备、输入、运行环境、降级策略）占据较高实现复杂度。
3. 课堂模式契约已建立，但局部仍依赖运行时推断而非纯静态声明。

本设计文档的目标不是“渐进优化”，而是进行一次明确的“债务归零导向”架构收敛。

---

## 2. 设计目标与非目标

### 2.1 目标

1. 清除兼容分支与历史补丁路径，收敛到单一路径运行时。
2. 统一场景工程结构，确保新场景接入成本稳定且可预测。
3. 领域逻辑（尤其静电场）从场景 UI 中解耦，形成共享 domain 层。
4. 在不牺牲课堂核心原则的前提下，降低心智负担和维护成本。

### 2.2 非目标

1. 不保证低端设备、旧浏览器、非标准环境可用。
2. 不保留“无 Worker/无 WebGL 的软降级体验”。
3. 不维持历史触控高阶交互（如三指模式切换）的一致行为。

---

## 3. 现状基线（2026-03-03 实测）

### 3.1 质量与可交付状态

1. `npm run verify:ci` 通过（lint + 222 tests + build + preload budget + bundle budget）。
2. `npm run check:clean-build` 通过。
3. 场景壳层长度预算检查通过，唯一放宽项：
   - `src/scenes/electrostatic-lab/ElectrostaticLabScene.tsx` 440 行（allowlist 上限 520）。

### 3.2 规模基线

1. `src` 生产代码：约 11690 LOC。
2. `src` 测试代码：约 3759 LOC。
3. `scripts`：约 1884 LOC。

### 3.3 高风险热点

1. `src/scenes/electrostatic-lab/ElectrostaticLabScene.tsx`：440 LOC，状态/UI/交互耦合偏重。
2. `src/scene3d/InteractiveCanvas.tsx`：307 LOC，兼容逻辑聚合。
3. `src/app/demoRoutes.ts`：205 LOC，路由、预加载包装、目录发现、契约汇聚于同层。
4. `src/styles/shell.css`：836 LOC，壳层视觉规则体量仍偏大。

### 3.4 预算压力

1. `vendor-three-core`：约 93.1% 预算占用。
2. `app-entry-css`：约 91.3% 预算占用。
3. `vendor-react`：约 89.5% 预算占用。

结论：当前稳定性合格，但复杂度余量已接近“扩展临界点”。

---

## 4. 历史包袱成因（架构演进视角）

### 4.1 阶段一：快速交付

以“先可演示”为目标，形成单场景文件承载状态、视图、公式、交互的实现习惯。

### 4.2 阶段二：课堂能力叠加

引入课堂模式、触控一致性、预加载策略与运行时保护，显著提高鲁棒性，同时引入横切复杂度。

### 4.3 阶段三：偿债进行中

已完成 route/catalog 合并、SceneLayout 拆分、部分场景壳层化。但新旧范式并存，导致“可运行但不够纯”。

---

## 5. 技术债地图（按优先级）

## P0（必须先清）

1. `electrostatic-lab` 场景壳层仍超出统一预算，成为结构异类。
2. `InteractiveCanvas` 承担过多职责（手势、反馈、守卫、降级、相机联动）。
3. `equipotential` 与 `electrostatic-lab` 领域逻辑并行实现，重复率高。

## P1（高维护成本）

1. Worker/local 双栈使仿真路径分裂，异常处理和测试矩阵膨胀。
2. 课堂信号采用“静态声明 + 运行时 DOM 扫描”混合契约，边界不纯。
3. 路由预热策略耦合设备/网络探测，收益边际下降但复杂度持续存在。

## P2（持续摩擦）

1. 脚手架仍偏“单文件场景模板”，不是目标架构模板。
2. route-load budget 仅验证首个 demo，不是全场景基线。
3. 文档存在轻微滞后，历史债务描述与现状不完全同步。

---

## 6. 兼容性代价账本

以下模块可视为“兼容/兜底复杂度主体”，合计约 1723 LOC（约占生产代码 14.7%）：

1. `src/scene3d/InteractiveCanvas.tsx`（307）
2. `src/scene3d/touchInteractionKernel.ts`（206）
3. `src/workers/simClient.ts`（178）
4. `src/core/useParticleSimulation.ts`（159）
5. `src/scene3d/threeConsoleFilter.ts`（131）
6. `src/app/useGlobalShortcuts.ts`（109）
7. `src/store/useAppStore.ts`（97）
8. `src/app/routeWarmupPolicy.ts`（95）
9. `src/ui/layout/usePresentationStrategy.ts`（82）
10. `src/app/demoRoutes.ts`（205，包含运行时目录发现与包装策略）
11. 其余兼容辅助（`wheelZoomIntent` / `webglSupport` / `canvasQuality` / `gestureMapper`）

兼容专项测试约 562 LOC（touch/wheel/webgl/warmup/worker fallback 等）。

---

## 7. 评分体系与当前评分

评分规则：10 分制，按权重折算到 100 分。

1. 可构建可复现（15%）：9.2
2. 自动化测试与质量闸门（15%）：8.8
3. 架构一致性（20%）：6.2
4. 领域解耦与复用（15%）：5.6
5. 兼容复杂度可控性（15%）：4.2
6. 性能治理（10%）：8.0
7. 文档与工具一致性（10%）：6.5

**当前综合分：68.6 / 100**

目标分（完成本方案后）：**90+ / 100**

---

## 8. 方案对比与推荐

### 方案 A：一次性去兼容 + 架构收敛（推荐）

1. 固定运行环境（Chromium + WebGL2 + Worker + Pointer Events）。
2. 删除双路径兼容逻辑。
3. 全场景统一新契约与目录结构。

优点：复杂度快速下降，清债效果最大。  
缺点：行为变化明显，需要明确课堂使用边界。

### 方案 B：先统一结构，后删兼容

优点：迁移平滑。  
缺点：过渡期复杂度更高，极易拖延。

### 方案 C：按场景逐步替换

优点：单次改动小。  
缺点：新旧共存周期长，收益滞后。

**推荐：方案 A。** 在“不考虑兼容性”的目标下，A 是唯一与目标一致的策略。

---

## 9. 目标架构（去兼容化版本）

### 9.1 运行时前置约束

应用启动时强校验：

1. 必须存在 `Worker`。
2. 必须支持 `WebGL2`（不可用则显示环境不支持页并阻断场景）。
3. 必须支持 Pointer Events。

不再提供本地 fallback、弱能力退化与隐式降级路径。

### 9.2 场景目录统一契约

每个场景固定为：

1. `index.ts`：导出 `SceneDescriptor`。
2. `scene/SceneShell.tsx`：壳层编排，仅拼装不写核心逻辑。
3. `state/useXxxState.ts`：状态流与 action。
4. `domain/*.ts`：纯数学/物理模型。
5. `view/*Rig3D.tsx`：纯渲染层。
6. `view/*Controls.tsx`：纯控件层。
7. `classroom.ts`：`presentationSignals` 与 `coreSummary` 生成器。

### 9.3 路由与注册

1. 路由统一从 `SceneDescriptor` 自动发现。
2. `config/demo-scenes.json` 仅保留课堂文案、排序、E2E 文本配置。
3. 禁止手写场景映射表。

### 9.4 课堂模式契约（保留且强化）

1. 必须显式声明 `presentationSignals`。
2. 必须提供 3-5 行 `coreSummary`。
3. 关键信息节点必须含 `data-presentation-signal`。
4. 折叠控制面板时，1080P 仍可见核心摘要。

注：课堂契约属于产品目标，不属于兼容层，必须保留。

---

## 10. 分阶段落地计划（4-6 周）

## Phase 1（第 1 周）：切断兼容入口

1. 删除 Worker/local fallback，仿真统一 Worker。
2. 移除 `wheelZoomIntentGuard` 和三指触控模式切换。
3. 将 WebGL 支持改为启动前置断言。

验收：

1. 兼容相关核心模块 LOC 明显下降。
2. 不再出现 `mode: 'local'` 语义。

## Phase 2（第 2-3 周）：场景结构统一

1. 拆分 `electrostatic-lab` 壳层，移除 allowlist。
2. 场景 shell 统一强制上限 240 行，无例外白名单。
3. 脚手架升级为新目录模板。

验收：

1. 所有 `*Scene.tsx` <= 240 行。
2. 新建场景不需手工补丁即可运行 + 测试通过。

## Phase 3（第 4 周）：领域收敛

1. 新建 `domains/electrostatics`。
2. 合并 charge 操作、potential/e-field 采样、preset 逻辑。
3. `equipotential` 与 `electrostatic-lab` 改为共享 domain。

验收：

1. 重复逻辑归并到 domain 层。
2. 场景仅保留 UI 与可视化差异。

## Phase 4（第 5-6 周）：治理闭环

1. `check-clean-build` 对齐严格 archive 语义。
2. `check:route-load-budget` 覆盖全场景。
3. 去除与已删除兼容路径对应的历史测试，补充新契约测试。

验收：

1. CI 闸门全部通过。
2. 无兼容性残留分支进入主干。

---

## 11. 测试策略调整

### 11.1 删除类

1. Worker/local fallback 相关测试。
2. 三指模式切换与 wheel intent guard 相关测试。
3. 低能力设备降级策略测试。

### 11.2 新增类

1. 场景结构契约测试（目录与导出规范）。
2. 课堂模式行为测试（1080P 折叠保底）。
3. 静电 domain 共享测试（跨场景一致性）。
4. 全路由加载预算测试。

---

## 12. 风险与约束

1. 风险：丢失低端设备容错。  
   处理：在 README 明确运行环境要求。

2. 风险：触控交互能力下降。  
   处理：保留单指旋转、双指缩放/平移基础集，不再做模式切换。

3. 风险：迁移阶段行为波动。  
   处理：每阶段必须附带可回归 E2E 与课堂模式行为检查。

---

## 13. 完成定义（Definition of Done）

满足以下全部条件才算“债务清零阶段完成”：

1. 兼容相关代码占比降至生产代码的 5% 以下。
2. 所有场景壳层 <= 240 行，且无 allowlist。
3. 电静领域逻辑统一到共享 `domains/electrostatics`。
4. 不存在 local fallback 与 runtime 隐式降级路径。
5. 课堂模式契约全场景通过（声明 + 信号 + 摘要 + 折叠可见）。
6. `verify:ci`、`check:clean-build`、全路由预算检查全绿。

---

## 14. 最终建议

在当前仓库成熟度下，继续“小修小补”会把复杂度长期锁在中高位。  
若目标是“最大化清债、彻底解耦、长期可扩展”，应立即执行方案 A，优先做兼容分支切除与架构统一，再完成领域收敛。

这是一次有意识的产品边界重设，不是代码美化。

