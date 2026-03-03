# No-Compat Debt Purge Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在不考虑向后兼容的前提下，移除兼容性复杂路径并完成场景/领域结构收敛，把项目从“可维护”推进到“可持续演化”。

**Architecture:** 采用“先切兼容分支、再做结构统一、最后封闭治理闸门”的顺序。运行时固定为现代 Chromium 教学环境，取消 local fallback、弱环境降级与高阶兼容手势。以统一场景契约和共享 domain 层降低长期维护成本。

**Tech Stack:** TypeScript, React, Vite, Vitest, Testing Library, Playwright, Three.js, GitHub Actions

---

## 0. 执行前准备（一次性）

### Task 0: 建立隔离工作区与主分支

**Files:**
- None

**Step 1: 新建 worktree 并切分支**

Run:
```bash
git worktree add ../3dmotion-no-compat -b codex/no-compat-debt-purge
```
Expected: 新目录 `../3dmotion-no-compat` 创建成功，分支名带 `codex/` 前缀。

**Step 2: 安装依赖**

Run:
```bash
cd ../3dmotion-no-compat
npm ci
```
Expected: 安装成功，无 lockfile 漂移。

**Step 3: 记录基线**

Run:
```bash
npm run verify:ci
npm run check:clean-build
```
Expected: 全部 PASS，作为后续对照基线。

**Step 4: Commit（可选）**

```bash
git commit --allow-empty -m "chore(plan): start no-compat debt purge execution"
```

---

## PR 切分总览

1. PR-01 运行时硬门禁（不再软降级）
2. PR-02 3D 交互层去兼容化（移除 wheel/touch 高阶守卫）
3. PR-03 仿真栈单路径化（Worker-only）
4. PR-04 场景结构统一（electrostatic-lab 拆壳并去 allowlist）
5. PR-05 静电领域收敛（共享 electrostatics domain）
6. PR-06 脚手架升级（生成新架构模板）
7. PR-07 CI 治理封口（更严格 clean-build + 全路由预算）
8. PR-08 文档与课堂契约回归（说明和验收脚本对齐）

---

## 1. 运行时硬门禁

### Task 1 (PR-01): 以环境前置校验替代运行时软降级

**Files:**
- Create: `src/app/runtimeCapabilities.ts`
- Create: `src/app/__tests__/runtimeCapabilities.test.ts`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/scene3d/InteractiveCanvas.tsx`
- Delete: `src/scene3d/webglSupport.ts`
- Delete: `src/scene3d/__tests__/webglSupport.test.ts`

**Step 1: 写失败测试（运行时能力矩阵）**

在 `runtimeCapabilities.test.ts` 覆盖：
1. 缺少 Worker 返回不支持。
2. 缺少 WebGL2 返回不支持。
3. 三项能力齐备返回支持。

Run:
```bash
npm test -- src/app/__tests__/runtimeCapabilities.test.ts
```
Expected: FAIL（模块尚不存在）。

**Step 2: 写失败测试（App 门禁行为）**

在 `App.test.tsx` 增加：
1. 不支持环境时渲染阻断页，不渲染场景导航。
2. 支持环境时保留当前行为。

Run:
```bash
npm test -- src/App.test.tsx
```
Expected: FAIL（门禁逻辑尚未接入）。

**Step 3: 最小实现**

1. 新增 `runtimeCapabilities.ts` 暴露 `isRuntimeSupported()`。
2. `App.tsx` 启动阶段先判定能力，不满足时展示单独阻断 UI。
3. `InteractiveCanvas.tsx` 删除 WebGL fallback 分支。
4. 删除 `webglSupport` 及相关测试。

**Step 4: 验证**

Run:
```bash
npm test -- src/app/__tests__/runtimeCapabilities.test.ts src/App.test.tsx
npm run lint
```
Expected: PASS。

**Step 5: Commit A**

```bash
git add src/app/runtimeCapabilities.ts src/app/__tests__/runtimeCapabilities.test.ts src/App.tsx src/App.test.tsx
git commit -m "feat(runtime): hard-gate unsupported environments before app mount"
```

**Step 6: Commit B**

```bash
git add src/scene3d/InteractiveCanvas.tsx
git rm src/scene3d/webglSupport.ts src/scene3d/__tests__/webglSupport.test.ts
git commit -m "refactor(canvas): remove runtime webgl fallback path"
```

---

## 2. 交互层去兼容化

### Task 2 (PR-02): 删除高阶兼容手势与 wheel 意图守卫

**Files:**
- Modify: `src/scene3d/InteractiveCanvas.tsx`
- Modify: `src/scene3d/cameraControls.ts`
- Delete: `src/scene3d/touchInteractionKernel.ts`
- Delete: `src/scene3d/gestureMapper.ts`
- Delete: `src/scene3d/wheelZoomIntent.ts`
- Delete: `src/scene3d/__tests__/touchInteractionKernel.test.ts`
- Delete: `src/scene3d/__tests__/gestureMapper.test.ts`
- Delete: `src/scene3d/__tests__/wheelZoomIntent.test.ts`
- Modify: `src/app/demoRoutes.ts`
- Modify: `src/app/routeConformance.ts`
- Modify: `src/app/__tests__/demoRouteConformance.test.ts`

**Step 1: 写失败测试（新触控契约）**

将 touch 约束降为基础集：
1. 单指旋转。
2. 双指缩放/平移。
3. 双击重置（可保留）。
4. 不再要求 `threeFingerModeSwitch`。

Run:
```bash
npm test -- src/app/__tests__/demoRouteConformance.test.ts
```
Expected: FAIL（旧契约仍要求三指切换）。

**Step 2: 最小实现（路由契约）**

1. 删除 `threeFingerModeSwitch` 字段及其校验。
2. 更新 `DEMO_ROUTES` touchProfile 类型和默认值。

**Step 3: 最小实现（Canvas 交互）**

1. 删除三指模式切换状态和反馈文案。
2. 删除 wheel intent guard 分支及开关。
3. 保留基础统一交互文案（鼠标 + 双指）。

**Step 4: 清理废弃模块与测试**

删除对应工具模块和测试，修复 import。

**Step 5: 验证**

Run:
```bash
npm test -- src/app/__tests__/demoRouteConformance.test.ts src/scenes/__tests__/interactionPolicy.test.tsx
npm test -- src/scene3d
npm run lint
```
Expected: PASS。

**Step 6: Commit**

```bash
git add src/app/demoRoutes.ts src/app/routeConformance.ts src/app/__tests__/demoRouteConformance.test.ts src/scene3d/InteractiveCanvas.tsx src/scene3d/cameraControls.ts
git rm src/scene3d/touchInteractionKernel.ts src/scene3d/gestureMapper.ts src/scene3d/wheelZoomIntent.ts src/scene3d/__tests__/touchInteractionKernel.test.ts src/scene3d/__tests__/gestureMapper.test.ts src/scene3d/__tests__/wheelZoomIntent.test.ts
git commit -m "refactor(interaction): drop advanced compatibility gestures and wheel guard"
```

---

## 3. 仿真单路径化

### Task 3 (PR-03): Worker-only 仿真执行链路

**Files:**
- Modify: `src/workers/simClient.ts`
- Modify: `src/core/useParticleSimulation.ts`
- Modify: `src/scenes/cyclotron/CyclotronScene.tsx`
- Modify: `src/workers/__tests__/simClient.test.ts`
- Modify: `src/core/__tests__/simController.test.ts` (如需)

**Step 1: 写失败测试（禁止 local mode）**

在 `simClient.test.ts` 增加：
1. 默认 stepper 仅返回 `worker` 模式。
2. Worker 创建失败时抛出显式错误（不 fallback）。

Run:
```bash
npm test -- src/workers/__tests__/simClient.test.ts
```
Expected: FAIL。

**Step 2: 实现 Worker-only simClient**

1. 删除 `createLocalSimulationStepper` 暴露。
2. `createDefaultSimulationStepper` 改为失败即抛错。

**Step 3: 更新 useParticleSimulation 错误面**

1. 初始化阶段捕获 worker 创建错误，写入 `status.error`。
2. UI 层显示明确错误来源。

**Step 4: 更新场景文案**

`CyclotronScene.tsx` 中 `modeText` 去除 `Local fallback` 语义。

**Step 5: 验证**

Run:
```bash
npm test -- src/workers/__tests__/simClient.test.ts src/core/__tests__/simController.test.ts src/scenes/cyclotron/__tests__/runtime.test.ts
npm run lint
```
Expected: PASS。

**Step 6: Commit**

```bash
git add src/workers/simClient.ts src/core/useParticleSimulation.ts src/scenes/cyclotron/CyclotronScene.tsx src/workers/__tests__/simClient.test.ts src/core/__tests__/simController.test.ts
git commit -m "refactor(sim): remove local fallback and enforce worker-only execution"
```

---

## 4. 场景结构统一（重点）

### Task 4 (PR-04): electrostatic-lab 拆壳并清除壳层 allowlist

**Files:**
- Create: `src/scenes/electrostatic-lab/useElectrostaticLabState.ts`
- Create: `src/scenes/electrostatic-lab/ElectrostaticLabControls.tsx`
- Modify: `src/scenes/electrostatic-lab/ElectrostaticLabScene.tsx`
- Modify: `src/scenes/electrostatic-lab/__tests__/structure.test.tsx`
- Modify: `scripts/ci/check-scene-shell-length.mjs`

**Step 1: 写失败测试（壳层职责）**

在 `structure.test.tsx` 增加断言：
1. 壳层只拼装 controls + viewport + summary。
2. 业务状态迁移到 hook（通过 mock hook 返回值验证）。

Run:
```bash
npm test -- src/scenes/electrostatic-lab/__tests__/structure.test.tsx
```
Expected: FAIL。

**Step 2: 抽离状态 hook**

把 `ElectrostaticLabScene.tsx` 中 state/useMemo/action 迁移到 `useElectrostaticLabState.ts`。

**Step 3: 抽离 Controls**

把左侧 controls JSX 迁移到 `ElectrostaticLabControls.tsx`。

**Step 4: 收敛 Scene 壳层**

`ElectrostaticLabScene.tsx` 仅保留：
1. hook 调用。
2. `SceneLayout` 编排。
3. rig 组件挂载。

**Step 5: 更新壳层预算**

1. 让 `ElectrostaticLabScene.tsx` 降到 <= 240 行。
2. 删除 `check-scene-shell-length.mjs` 中 electrostatic allowlist。

**Step 6: 验证**

Run:
```bash
npm run check:scene-shell-length
npm test -- src/scenes/electrostatic-lab
npm run lint
```
Expected: PASS。

**Step 7: Commit（建议拆 2 个）**

```bash
git add src/scenes/electrostatic-lab/useElectrostaticLabState.ts src/scenes/electrostatic-lab/ElectrostaticLabControls.tsx src/scenes/electrostatic-lab/ElectrostaticLabScene.tsx src/scenes/electrostatic-lab/__tests__/structure.test.tsx
git commit -m "refactor(electrostatic-lab): split shell into state and controls modules"
```

```bash
git add scripts/ci/check-scene-shell-length.mjs
git commit -m "ci(scene-shell): remove electrostatic allowlist after shell split"
```

---

## 5. 静电领域收敛

### Task 5 (PR-05): 建立共享 `domains/electrostatics`

**Files:**
- Create: `src/domains/electrostatics/types.ts`
- Create: `src/domains/electrostatics/charges.ts`
- Create: `src/domains/electrostatics/potential.ts`
- Create: `src/domains/electrostatics/field.ts`
- Create: `src/domains/electrostatics/presets.ts`
- Create: `src/domains/electrostatics/__tests__/potential.test.ts`
- Create: `src/domains/electrostatics/__tests__/charges.test.ts`
- Modify: `src/scenes/equipotential/model.ts`
- Modify: `src/scenes/electrostatic-lab/model.ts`
- Modify: `src/scenes/equipotential/model.test.ts`
- Modify: `src/scenes/electrostatic-lab/model.test.ts`

**Step 1: 写失败测试（共享域 API）**

新增 domain 测试覆盖：
1. charge id 生成。
2. potential 采样符号一致性。
3. e-field 采样稳定性。

Run:
```bash
npm test -- src/domains/electrostatics/__tests__/potential.test.ts src/domains/electrostatics/__tests__/charges.test.ts
```
Expected: FAIL。

**Step 2: 实现共享 domain**

实现最小可用 API，不引入 UI 依赖。

**Step 3: 场景模型迁移**

1. `equipotential/model.ts` 改用 shared domain 基础能力。
2. `electrostatic-lab/model.ts` 改用同一套采样/charge 工具。

**Step 4: 回归测试更新**

对齐原有 model 测试断言，确保行为一致。

**Step 5: 验证**

Run:
```bash
npm test -- src/scenes/equipotential/model.test.ts src/scenes/electrostatic-lab/model.test.ts src/domains/electrostatics/__tests__/potential.test.ts src/domains/electrostatics/__tests__/charges.test.ts
npm run lint
```
Expected: PASS。

**Step 6: Commit**

```bash
git add src/domains/electrostatics src/scenes/equipotential/model.ts src/scenes/electrostatic-lab/model.ts src/scenes/equipotential/model.test.ts src/scenes/electrostatic-lab/model.test.ts
git commit -m "refactor(electrostatics): extract shared domain model for charges and field sampling"
```

---

## 6. 脚手架升级

### Task 6 (PR-06): 让 `scaffold:scene` 生成新架构模板

**Files:**
- Modify: `scripts/scaffold/new-scene.mjs`
- Create: `scripts/scaffold/__tests__/new-scene.test.mjs`
- Modify: `README.md`
- Modify: `docs/presentation-signal-playbook.md`

**Step 1: 写失败测试（脚手架产物结构）**

断言新脚手架输出包含：
1. `useXxxSceneState.ts`
2. `XxxControls.tsx`
3. `XxxRig3D.tsx`
4. `XxxScene.tsx`（壳层）

Run:
```bash
npm test -- scripts/scaffold/__tests__/new-scene.test.mjs
```
Expected: FAIL。

**Step 2: 实现脚手架模板升级**

重写模板生成逻辑，默认输出分层结构。

**Step 3: 更新文档**

README + playbook 同步新生成目录说明。

**Step 4: 验证**

Run:
```bash
npm test -- scripts/scaffold/__tests__/new-scene.test.mjs
npm run lint
```
Expected: PASS。

**Step 5: Commit**

```bash
git add scripts/scaffold/new-scene.mjs scripts/scaffold/__tests__/new-scene.test.mjs README.md docs/presentation-signal-playbook.md
git commit -m "feat(scaffold): generate layered scene modules by default"
```

---

## 7. CI 治理封口

### Task 7 (PR-07): 强化 clean-build 与全路由预算检查

**Files:**
- Modify: `scripts/ci/check-clean-build.mjs`
- Modify: `scripts/perf/assert-route-load-budget.mjs`
- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`

**Step 1: 写失败测试/脚本验证（clean-build 语义）**

`check-clean-build` 改为真正 archive 流程：
1. `git archive HEAD | tar -x` 到临时目录。
2. 临时目录 `npm ci && npm run build`。

Run:
```bash
npm run check:clean-build
```
Expected: 先 FAIL（实现未更新前）。

**Step 2: 实现 clean-build 脚本升级**

去掉 “复制工作区文件” 方式，改为 archive-only。

**Step 3: 扩展 route-load budget**

遍历 `DEMO_CATALOG` 全量路由，而非仅首个场景。

**Step 4: workflow 接入**

CI 增加/调整步骤，确保两项检查在 verify 阶段强制执行。

**Step 5: 验证**

Run:
```bash
npm run check:clean-build
npm run check:route-load-budget
npm run verify:ci
```
Expected: PASS。

**Step 6: Commit**

```bash
git add scripts/ci/check-clean-build.mjs scripts/perf/assert-route-load-budget.mjs package.json .github/workflows/ci.yml
git commit -m "ci: enforce archive-only clean build and full-route load budgets"
```

---

## 8. 文档与契约回归

### Task 8 (PR-08): 清理兼容叙事并对齐课堂契约文档

**Files:**
- Modify: `README.md`
- Modify: `docs/classroom-presentation-principles.md`
- Modify: `docs/presentation-signal-playbook.md`
- Modify: `docs/plans/2026-03-03-no-compat-debt-purge-design-v2.md` (必要时补充结论)

**Step 1: 写文档差异检查清单**

人工检查项：
1. 不再出现 local fallback/弱环境降级承诺。
2. 课堂模式原则仍完整保留。
3. 新运行环境要求明确。

**Step 2: 更新文档**

同步删改兼容承诺和使用说明。

**Step 3: 验证**

Run:
```bash
npm run lint
npm run verify:ci
```
Expected: PASS。

**Step 4: Commit**

```bash
git add README.md docs/classroom-presentation-principles.md docs/presentation-signal-playbook.md docs/plans/2026-03-03-no-compat-debt-purge-design-v2.md
git commit -m "docs: align classroom and runtime docs with no-compat architecture"
```

---

## 最终验收（合并前）

Run:
```bash
npm run verify:ci
npm run check:clean-build
npm run test:e2e:ci
npm run check:route-load-budget
```

Expected:
1. 全部 PASS。
2. `check:scene-shell-length` 无 allowlist。
3. 不再存在 `Local fallback`、`threeFingerModeSwitch`、`wheelZoomIntentGuard` 相关生产路径。
4. `electrostatic-lab` 壳层长度 <= 240 行。

---

## 推荐 PR 合并顺序

1. PR-01 -> PR-02 -> PR-03（先切兼容分支）
2. PR-04 -> PR-05 -> PR-06（结构收敛）
3. PR-07 -> PR-08（治理封口与文档对齐）

每个 PR 合并后都执行一次：
```bash
npm run verify:ci && npm run check:clean-build
```

