# Electromagnetic Drive Palette + Crank Fix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the experiment board use a light default palette while preserving the current dark palette for night mode, and fix the crank handle geometry so the apparatus matches the reference animation more closely.

**Architecture:** Keep the scene structure unchanged and adjust palette tokens only inside `electromagnetic-drive.css`, moving the current dark board treatment under `.app-shell.theme-night`. For the apparatus issue, fix the crank handle at the rig geometry layer in `ElectromagneticDriveRig3D.tsx`, preserving the existing rotation binding to `magnetAngle` while correcting the handle’s local orientation to match the reference scene.

**Tech Stack:** React, TypeScript, Vitest, Testing Library, CSS, react-three-fiber JSX scene graph.

---

### Task 1: Lock visual regressions with tests

**Files:**
- Create: `src/scenes/electromagnetic-drive/layoutCss.test.ts`
- Create: `src/scenes/electromagnetic-drive/rig.test.tsx`

**Step 1:** Write a failing CSS regression test asserting the default board palette is light and the night palette remains dark.

**Step 2:** Run the CSS test and confirm it fails against the current always-dark board styles.

**Step 3:** Write a failing rig regression test asserting the crank handle remains a vertical cylinder at the crank tip.

**Step 4:** Run the rig test and confirm it fails against the current sideways handle geometry.

### Task 2: Fix board palette semantics

**Files:**
- Modify: `src/scenes/electromagnetic-drive/electromagnetic-drive.css`

**Step 1:** Move the current dark board treatment into the night-mode selectors.

**Step 2:** Define a light default board/card/readout palette with sufficient day-mode contrast.

**Step 3:** Re-run the CSS regression test until green.

### Task 3: Fix crank handle geometry

**Files:**
- Modify: `src/scenes/electromagnetic-drive/ElectromagneticDriveRig3D.tsx`

**Step 1:** Keep the crank group bound to `magnetAngle`.

**Step 2:** Remove the incorrect local rotation from the handle cylinder so it matches the reference orientation.

**Step 3:** Re-run the rig regression test until green.

### Task 4: Verify the scene end-to-end

**Files:**
- Verify: `src/scenes/electromagnetic-drive/*`

**Step 1:** Run the targeted electromagnetic-drive tests.

**Step 2:** Run `npm run lint`, `npm test`, and `npm run build` before claiming completion.
