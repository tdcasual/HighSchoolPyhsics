# 3D Electromagnetics Platform Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an MVP web app with two interactive teaching scenes: Oscilloscope and Cyclotron, backed by a shared simulation core.

**Architecture:** Use React + React Three Fiber for UI/3D rendering and Web Worker for deterministic physics stepping. Keep scene logic behind a shared interface, and derive all render/UI metrics from simulation state.

**Tech Stack:** TypeScript, React, Vite, React Three Fiber, Three.js, Zustand, Vitest, Testing Library

---

### Task 1: Scaffold project and test setup

**Files:**
- Create: `package.json` and Vite scaffold files
- Create: `vitest.config.ts`, `src/test/setup.ts`
- Test: `src/App.test.tsx`

**Step 1: Write the failing test**

Create `src/App.test.tsx` expecting title and two scene buttons.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/App.test.tsx`  
Expected: FAIL (components not implemented yet).

**Step 3: Write minimal implementation**

Add app shell with scene switch buttons and heading.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/App.test.tsx`  
Expected: PASS.

### Task 2: Shared simulation core (TDD)

**Files:**
- Create: `src/core/types.ts`
- Create: `src/core/numeric-guards.ts`
- Create: `src/core/integrators/semiImplicitEuler.ts`
- Test: `src/core/__tests__/semiImplicitEuler.test.ts`

**Step 1: Write the failing test**

Add tests for:
1. position/velocity update with constant acceleration
2. guard rejects invalid state (`NaN`, `Infinity`)

**Step 2: Run test to verify it fails**

Run: `npm test -- src/core/__tests__/semiImplicitEuler.test.ts`  
Expected: FAIL.

**Step 3: Write minimal implementation**

Implement typed state, integration step, and numeric guard.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/core/__tests__/semiImplicitEuler.test.ts`  
Expected: PASS.

### Task 3: Oscilloscope scene model (TDD)

**Files:**
- Create: `src/scenes/oscilloscope/model.ts`
- Test: `src/scenes/oscilloscope/model.test.ts`

**Step 1: Write the failing test**

Add tests for:
1. sine sampling returns expected value for known time/phase
2. derived readings include `frequencyHz`, `vpp`, `vrms`

**Step 2: Run test to verify it fails**

Run: `npm test -- src/scenes/oscilloscope/model.test.ts`  
Expected: FAIL.

**Step 3: Write minimal implementation**

Implement sample generator and derived metrics.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/scenes/oscilloscope/model.test.ts`  
Expected: PASS.

### Task 4: Cyclotron scene model (TDD)

**Files:**
- Create: `src/scenes/cyclotron/model.ts`
- Test: `src/scenes/cyclotron/model.test.ts`

**Step 1: Write the failing test**

Add tests for:
1. magnetic-only motion changes direction and keeps speed approximately constant
2. derived cyclotron period matches `2πm/(qB)` within tolerance

**Step 2: Run test to verify it fails**

Run: `npm test -- src/scenes/cyclotron/model.test.ts`  
Expected: FAIL.

**Step 3: Write minimal implementation**

Implement Lorentz-force step and observables.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/scenes/cyclotron/model.test.ts`  
Expected: PASS.

### Task 5: Scene UI and rendering integration

**Files:**
- Create: `src/scenes/oscilloscope/OscilloscopeScene.tsx`
- Create: `src/scenes/cyclotron/CyclotronScene.tsx`
- Modify: `src/App.tsx`
- Create: `src/store/useAppStore.ts`
- Test: `src/scenes/__tests__/sceneSwitching.test.tsx`

**Step 1: Write the failing test**

Add test for scene switch controls rendering correct panel labels.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/scenes/__tests__/sceneSwitching.test.tsx`  
Expected: FAIL.

**Step 3: Write minimal implementation**

Implement scene switching, control panel, and minimal R3F canvases.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/scenes/__tests__/sceneSwitching.test.tsx`  
Expected: PASS.

### Task 6: Worker integration and final verification

**Files:**
- Create: `src/workers/sim.worker.ts`
- Create: `src/core/simController.ts`
- Modify: scene components to consume worker loop

**Step 1: Write the failing test**

Add controller test that verifies worker-like tick updates state.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/core/__tests__/simController.test.ts`  
Expected: FAIL.

**Step 3: Write minimal implementation**

Implement worker protocol and controller fallback for tests.

**Step 4: Run full verification**

Run:
1. `npm test`
2. `npm run build`

Expected:
1. All tests PASS
2. Build exits 0
