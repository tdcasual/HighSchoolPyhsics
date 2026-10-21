# Smart Presentation Runtime Contract Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make `config/demo-scenes.json` the runtime source of truth for classroom smart-presentation behavior, then extend the 1080P browser regression to all catalog scenes.

**Architecture:** Introduce a lightweight scene catalog module that exports classroom contract types and lookup helpers without importing scene components. Wire `SceneLayout` and `InteractiveCanvas` to the active route’s `smartPresentation` contract so sticky summaries, staged layout overrides, and focus enablement are centrally enforced. Expand Playwright coverage by driving all scenes from catalog-backed expectations rather than hand-maintained partial coverage.

**Tech Stack:** React, Zustand, Vite, Vitest, Playwright, TypeScript

---

### Task 1: Extract runtime scene catalog

**Files:**
- Create: `src/app/sceneCatalog.ts`
- Modify: `src/app/demoRoutes.ts`
- Test: `src/app/__tests__/demoRouteConformance.test.ts`

**Step 1: Write the failing test**
- Add assertions that runtime catalog lookup returns the expected `smartPresentation` contract by route path.

**Step 2: Run test to verify it fails**
- Run: `npm test -- src/app/__tests__/demoRouteConformance.test.ts`

**Step 3: Write minimal implementation**
- Move catalog types + JSON parsing into `src/app/sceneCatalog.ts`.
- Export `SCENE_CATALOG`, `findSceneCatalogEntryByPath()`, and shared contract types.
- Update `demoRoutes.ts` to consume the shared catalog module.

**Step 4: Run test to verify it passes**
- Run: `npm test -- src/app/__tests__/demoRouteConformance.test.ts`

### Task 2: Enforce smart layout contract at runtime

**Files:**
- Modify: `src/ui/layout/usePresentationDirector.ts`
- Modify: `src/ui/layout/SceneLayout.tsx`
- Modify: `src/ui/layout/__tests__/SceneLayout.test.tsx`
- Modify: `src/scenes/oscilloscope/__tests__/classroomMode.test.tsx`
- Modify: `src/scenes/potential-energy/__tests__/classroomMode.test.tsx`

**Step 1: Write the failing test**
- Add layout tests that `smartPresentation.stickySummary = false` blocks sticky summary on 1920x1080.
- Add layout tests that only `smartPresentation.layout = staged` allows runtime `preferredLayout` switching.

**Step 2: Run test to verify it fails**
- Run: `npm test -- src/ui/layout/__tests__/SceneLayout.test.tsx src/scenes/oscilloscope/__tests__/classroomMode.test.tsx src/scenes/potential-energy/__tests__/classroomMode.test.tsx`

**Step 3: Write minimal implementation**
- Resolve active scene contract from the catalog in `SceneLayout`.
- Feed `smartPresentation` into `usePresentationDirector()`.
- Ignore `preferredLayout` unless the contract layout mode is `staged`.
- Prefer contract `stickySummary` over per-scene fallback hints.

**Step 4: Run test to verify it passes**
- Run the same Vitest command.

### Task 3: Enforce focus contract in 3D runtime

**Files:**
- Modify: `src/scene3d/InteractiveCanvas.tsx`
- Modify: `src/scene3d/__tests__/presentationCamera.test.ts`
- Modify: `src/scenes/cyclotron/__tests__/classroomMode.test.tsx`

**Step 1: Write the failing test**
- Add a test showing `presentationFocus` is suppressed when the active route contract has `smartPresentation.focus = false`.

**Step 2: Run test to verify it fails**
- Run: `npm test -- src/scene3d/__tests__/presentationCamera.test.ts`

**Step 3: Write minimal implementation**
- Resolve active scene contract in `InteractiveCanvas`.
- Downgrade to `overview` when contract focus is disabled.

**Step 4: Run test to verify it passes**
- Run the same test command.

### Task 4: Expand 1080P browser regression to full catalog

**Files:**
- Modify: `scripts/playwright/1080p-presentation-regression.mjs`
- Modify: `scripts/playwright/__tests__/demoCatalog.test.mjs`

**Step 1: Write the failing test**
- Add a unit test that every catalog scene is either covered by the regression script or auto-derived from catalog expectations.

**Step 2: Run test to verify it fails**
- Run: `npm test -- scripts/playwright/__tests__/demoCatalog.test.mjs`

**Step 3: Write minimal implementation**
- Make the 1080P regression iterate the catalog.
- Derive expected layout/focus behavior from `smartPresentation` plus explicit per-scene interaction steps only where needed.
- Keep screenshots for all scenes in `output/playwright/1080p-presentation`.

**Step 4: Run test to verify it passes**
- Run: `npm test -- scripts/playwright/__tests__/demoCatalog.test.mjs`

### Task 5: Verify end-to-end

**Files:**
- No new files required

**Step 1: Run focused tests**
- Run: `npm test -- src/app/__tests__/demoRouteConformance.test.ts src/ui/layout/__tests__/SceneLayout.test.tsx src/scene3d/__tests__/presentationCamera.test.ts src/scenes/oscilloscope/__tests__/classroomMode.test.tsx src/scenes/potential-energy/__tests__/classroomMode.test.tsx scripts/playwright/__tests__/demoCatalog.test.mjs`

**Step 2: Run browser regression**
- Run: `npm run test:1080p-presentation`

**Step 3: Run full verification**
- Run: `npm run verify:ci`
