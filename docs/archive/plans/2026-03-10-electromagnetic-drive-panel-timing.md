# Electromagnetic Drive Panel + Timing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move the experiment board into the left control area with partial collapsibility, then align scene timing more closely with the original wall-clock animation.

**Architecture:** Keep `SceneLayout` unchanged and relocate teach-critical signal blocks into `ElectromagneticDriveControls` so classroom mode can still discover them even when the control panel is collapsed. Preserve the existing pure per-step physics model in `model.ts`, and fix timing drift inside `useElectromagneticDriveSceneState.ts` with a fixed-step `requestAnimationFrame` accumulator so elapsed time, not render rate, determines progression.

**Tech Stack:** React, TypeScript, Vitest, Testing Library, existing classroom presentation runtime.

---

### Task 1: Lock the target layout behavior

**Files:**
- Modify: `src/scenes/electromagnetic-drive/__tests__/structure.test.tsx`
- Modify: `src/scenes/electromagnetic-drive/__tests__/classroomMode.test.tsx`

**Step 1:** Write a failing structure test asserting the board title, telemetry, explanation, and chart render in the left controls area.

**Step 2:** Run the scene structure tests and confirm the new assertion fails for the current viewport-overlay implementation.

**Step 3:** Write a failing controls interaction assertion for partially collapsible sections.

**Step 4:** Run the classroom/layout tests and confirm the controls-based signal assertions fail before implementation.

### Task 2: Refactor the board into controls

**Files:**
- Modify: `src/scenes/electromagnetic-drive/ElectromagneticDriveScene.tsx`
- Modify: `src/scenes/electromagnetic-drive/ElectromagneticDriveControls.tsx`
- Modify: `src/scenes/electromagnetic-drive/electromagnetic-drive.css`

**Step 1:** Pass the full scene state needed by the board into `ElectromagneticDriveControls`.

**Step 2:** Render the experiment board inside controls with telemetry, notes, and chart preserved.

**Step 3:** Add one or more partial-collapse toggles that keep key readout content readily available.

**Step 4:** Remove the viewport-side rail and keep the apparatus viewport visually stable.

**Step 5:** Re-run the targeted structure/classroom tests until green.

### Task 3: Lock timing against elapsed time

**Files:**
- Modify: `src/scenes/electromagnetic-drive/useElectromagneticDriveSceneState.test.tsx`
- Modify: `src/scenes/electromagnetic-drive/useElectromagneticDriveSceneState.ts`

**Step 1:** Write a failing timing test that simulates about two real seconds at slower RAF cadence and expects progression comparable to 60 Hz stepping.

**Step 2:** Run the hook test and confirm it fails because the current hook steps once per animation frame.

**Step 3:** Implement a fixed-step accumulator inside the hook, preserving pause/reset semantics.

**Step 4:** Re-run the hook test until green.

### Task 4: Verify the scene contract end-to-end

**Files:**
- Verify: `src/scenes/electromagnetic-drive/*`
- Verify: `src/app/__tests__/demoRouteConformance.test.ts`

**Step 1:** Run the electromagnetic-drive targeted tests.

**Step 2:** Run the broader classroom contract tests if needed.

**Step 3:** Run `npm run lint`, `npm test`, and `npm run build` before claiming completion.
