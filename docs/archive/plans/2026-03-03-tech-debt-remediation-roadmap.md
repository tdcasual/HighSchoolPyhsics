# Technical Debt Remediation Roadmap Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Resolve the current repository's highest-risk historical debt (build reproducibility, multi-source configuration drift, hotspot complexity) and establish a sustainable evolution path for classroom scenes.

**Architecture:** Use a phased debt strategy: first remove build blockers (P0), then consolidate contracts and ownership boundaries (P1), then optimize performance/observability while reducing long-term maintenance cost (P2). Keep each change test-first, with explicit CI gates and measurable acceptance criteria.

**Tech Stack:** TypeScript, React, Vite, Vitest, Testing Library, Playwright, GitHub Actions

---

## 0. Baseline (frozen on 2026-03-03)

- Current status: `npm run verify:ci` passes locally.
- Critical blocker: clean snapshot build fails because `vite.config.ts` imports `./build/chunking` while `build/` is ignored.
- Complexity hotspots:
  - `src/scenes/oersted/OerstedScene.tsx` (877 LOC)
  - `src/scenes/cyclotron/CyclotronScene.tsx` (581 LOC)
  - `src/scenes/mhd/MhdGeneratorScene.tsx` (527 LOC)
  - `src/ui/layout/SceneLayout.tsx` (306 LOC)
  - `src/App.css` (1256 LOC)
- Drift risk: route metadata is manually maintained across app runtime and Playwright catalog.

## 1. Timeline and Outcomes

### Phase A (Week 1-2, 2026-03-04 to 2026-03-17): Stop the bleeding

1. Remove clean-build blocker (P0)
2. Add reproducibility gate to CI
3. Lock a single source of truth for demo catalog metadata

**Definition of Done**
- `git archive HEAD | tar -x` fresh workspace can run `npm ci && npm run build` successfully.
- CI contains an explicit reproducibility check job.
- Playwright demo list is generated from the same source as app routes (no manual duplicated catalog edits).

### Phase B (Week 3-4, 2026-03-18 to 2026-03-31): Structural convergence

1. Extract scene state/3D rendering boundaries in Oersted
2. Split SceneLayout responsibilities into hooks/modules
3. Strengthen classroom contract tests from static metadata checks to behavior checks

**Definition of Done**
- Oersted scene logic split into state/model/3D view files with no behavior regression.
- SceneLayout main component reduced to orchestration layer (target <= 180 LOC).
- New or modified scenes must fail CI if classroom-mode fallback visibility contract breaks.

### Phase C (Week 5-8, 2026-04-01 to 2026-04-28): Performance + maintainability hardening

1. CSS architecture decomposition and token governance
2. Bundle and route-load budget enforcement
3. Controlled warning filtering and runtime observability

**Definition of Done**
- `App.css` no longer acts as monolithic global stylesheet.
- Performance budgets are codified and checked in CI.
- Three.js warning filtering policy is explicit, environment-aware, and test-covered.

## 2. Task Plan (bite-sized, TDD-first)

### Task 1: Fix reproducibility blocker (`build/` import debt)

**Files:**
- Modify: `vite.config.ts`
- Modify: `.gitignore`
- Move/Create: `build/chunking.ts`, `build/chunking.test.ts` (or relocate to tracked path such as `scripts/build/`)
- Test: a new reproducibility guard script in `scripts/ci/`

**Step 1: Write failing reproducibility check**
- Add script that creates a temporary `git archive` workspace and runs `npm ci && npm run build`.
- Ensure this script fails on current baseline.

**Step 2: Run check to verify fail**
Run:
```bash
node scripts/ci/check-clean-build.mjs
```
Expected: FAIL with missing `./build/chunking` import.

**Step 3: Minimal fix**
- Make chunking module import path point to a tracked file.
- Ensure chunking unit tests are in tracked path and run with normal test command.

**Step 4: Verify fix**
Run:
```bash
npm test
npm run build
node scripts/ci/check-clean-build.mjs
```
Expected: all PASS.

**Step 5: Commit**
```bash
git add vite.config.ts .gitignore scripts/ci/check-clean-build.mjs build/chunking.ts build/chunking.test.ts
git commit -m "fix(ci): restore clean-build reproducibility"
```

### Task 2: Add reproducibility gate in CI

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `package.json` (add `check:clean-build` script)

**Step 1: Write failing CI job locally (dry-run command)**
Run command manually and ensure non-zero exits are surfaced.

**Step 2: Add workflow step/job**
- Add `check:clean-build` in verify pipeline after dependency install.

**Step 3: Verify workflow syntax and local command**
Run:
```bash
npm run check:clean-build
npm run verify:ci
```
Expected: PASS.

**Step 4: Commit**
```bash
git add .github/workflows/ci.yml package.json
git commit -m "ci: enforce clean archive build gate"
```

### Task 3: Unify scene catalog source (remove route/e2e drift)

**Files:**
- Create: `src/app/sceneCatalog.ts` (or JSON if preferred for dual runtime)
- Modify: `src/app/demoRoutes.ts`
- Modify: `scripts/playwright/shared/demoCatalog.mjs`
- Test: `src/app/__tests__/demoRouteConformance.test.ts`
- Test: `scripts/playwright/__tests__/demoCatalog.test.mjs`

**Step 1: Add failing consistency test**
- Test should fail when app routes and Playwright catalog diverge.

**Step 2: Implement single source consumption**
- App route builder and Playwright catalog should derive from one shared data source (direct import or generated artifact).

**Step 3: Verify**
Run:
```bash
npm test -- src/app/__tests__/demoRouteConformance.test.ts
npm test -- scripts/playwright/__tests__/demoCatalog.test.mjs
npm test
```
Expected: PASS.

**Step 4: Commit**
```bash
git add src/app/sceneCatalog.ts src/app/demoRoutes.ts scripts/playwright/shared/demoCatalog.mjs src/app/__tests__/demoRouteConformance.test.ts scripts/playwright/__tests__/demoCatalog.test.mjs
git commit -m "refactor(routes): use single source for app and e2e catalogs"
```

### Task 4: Oersted scene split (state vs rendering)

**Files:**
- Create: `src/scenes/oersted/useOerstedSceneState.ts`
- Create: `src/scenes/oersted/OerstedRig3D.tsx`
- Create: `src/scenes/oersted/oerstedPresets.ts`
- Modify: `src/scenes/oersted/OerstedScene.tsx`
- Test: `src/scenes/oersted/__tests__/controls.test.tsx`
- Test: add structure/render regression test for extracted rig/state

**Step 1: Write failing tests around extracted behavior**
- Preset apply/reset behavior
- Classroom summary values
- Drag state reset behavior

**Step 2: Extract state hook with no behavior changes**
- Move state transitions and derived values to hook.

**Step 3: Extract 3D rig component**
- Move purely visual 3D subtree to dedicated component.

**Step 4: Verify**
Run:
```bash
npm test -- src/scenes/oersted
npm test
npm run build
```
Expected: PASS and same UI behavior.

**Step 5: Commit**
```bash
git add src/scenes/oersted
git commit -m "refactor(oersted): separate scene state and 3d rig"
```

### Task 5: SceneLayout decomposition (policy/orchestration separation)

**Files:**
- Create: `src/ui/layout/usePresentationStrategy.ts`
- Create: `src/ui/layout/useResizableSplitPanel.ts`
- Modify: `src/ui/layout/SceneLayout.tsx`
- Test: `src/ui/layout/__tests__/SceneLayout.test.tsx`
- Test: new hook tests in `src/ui/layout/__tests__/`

**Step 1: Write failing tests for extracted hooks**
- Auto strategy score behavior
- Route override precedence
- Divider resize keyboard/pointer boundaries

**Step 2: Move logic into hooks without behavior changes**
- Keep `SceneLayout` as composition shell.

**Step 3: Verify**
Run:
```bash
npm test -- src/ui/layout
npm test
```
Expected: PASS.

**Step 4: Commit**
```bash
git add src/ui/layout
git commit -m "refactor(layout): extract presentation and split-panel hooks"
```

### Task 6: Strengthen classroom-mode behavior tests

**Files:**
- Modify: `src/ui/layout/__tests__/SceneLayout.test.tsx`
- Create: per-scene classroom behavior tests in `src/scenes/*/__tests__/`

**Step 1: Add failing visibility tests**
- In presentation viewport mode with controls collapsed, each scene's `coreSummary` must remain visible.

**Step 2: Add failing signal tests**
- Verify key info blocks include `data-presentation-signal` in rendered controls.

**Step 3: Verify**
Run:
```bash
npm test -- src/ui/layout/__tests__/SceneLayout.test.tsx
npm test -- src/scenes
```
Expected: PASS.

**Step 4: Commit**
```bash
git add src/ui/layout/__tests__ src/scenes
git commit -m "test(classroom): enforce fallback visibility and presentation signals"
```

### Task 7: CSS architecture split and token governance

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/shell.css`
- Create: `src/styles/theme.css`
- Modify: `src/App.css` (progressive reduction)
- Modify: `src/main.tsx` or root imports

**Step 1: Add failing visual smoke checks (if available via Playwright snapshots)**
- Baseline screenshot diffs for overview + 4 scenes.

**Step 2: Move styles incrementally by concern**
- tokens -> shell -> theme -> scene-agnostic utility classes.

**Step 3: Verify**
Run:
```bash
npm test
npm run test:roundtrip
npm run build
```
Expected: PASS and no visual regression.

**Step 4: Commit**
```bash
git add src/styles src/App.css src/main.tsx
git commit -m "refactor(css): split global styles into tokenized modules"
```

### Task 8: Performance budgets and observability hardening

**Files:**
- Modify/Create: `scripts/perf/*` (bundle + route-load budgets)
- Modify: `package.json` scripts
- Modify: `.github/workflows/ci.yml`
- Modify: `src/scene3d/threeConsoleFilter.ts`
- Test: `src/scene3d/__tests__/threeConsoleFilter.test.ts`

**Step 1: Add failing perf budget checks**
- Define thresholds for vendor chunks and first scene navigation latency.

**Step 2: Add warning filter policy**
- Gate filter behavior by environment; document allowed suppressed warnings.

**Step 3: Verify**
Run:
```bash
npm run test:perf
npm test -- src/scene3d/__tests__/threeConsoleFilter.test.ts
npm run verify:ci
```
Expected: PASS.

**Step 4: Commit**
```bash
git add scripts/perf package.json .github/workflows/ci.yml src/scene3d/threeConsoleFilter.ts src/scene3d/__tests__/threeConsoleFilter.test.ts
git commit -m "chore(perf): enforce bundle budgets and explicit warning policy"
```

## 3. Milestone Exit Criteria

### 2-week checkpoint (2026-03-17)
- No clean-build blocker remains.
- CI has reproducibility job.
- Route catalog drift risk removed.

### 4-week checkpoint (2026-03-31)
- Oersted and SceneLayout refactor merged.
- Classroom behavior tests cover fallback visibility per scene.

### 8-week checkpoint (2026-04-28)
- CSS modularized and maintainable.
- Performance budget checks stable in CI.
- Warning filtering policy documented and tested.

## 4. Risks and Mitigations

1. Risk: Large refactors cause scene behavior regressions.
   - Mitigation: strict TDD, per-scene snapshot/smoke checks, small commits.

2. Risk: Catalog unification blocks Playwright runtime compatibility.
   - Mitigation: choose JSON or generated artifact compatible with both Node ESM and app bundle.

3. Risk: Performance budgets become flaky.
   - Mitigation: keep deterministic synthetic thresholds; avoid noisy network-dependent metrics in CI.

## 5. Command Pack (release-candidate verification)

```bash
npm run lint
npm test
npm run build
npm run check:homepage-preload
npm run test:roundtrip
npm run test:touch
npm run verify:ci
```
