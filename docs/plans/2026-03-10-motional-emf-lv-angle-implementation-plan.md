# Motional Emf L-v Angle Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extend the existing `motional-emf` classroom scene so teachers can explicitly control the angle between `L` and `v`, while keeping the `L-B` angle adjustable and displaying the derived `B-v` angle together with induced emf.

**Architecture:** Keep the full vector formula as the single source of truth in `model.ts`, but refactor velocity construction so it is derived from `rodAngleDeg`, a new discrete `L-v` preset, and a forward/backward motion sense. Push all formatted angle readouts through `useMotionalEmfSceneState`, then keep the classroom shell thin by updating `MotionalEmfControls`, `MotionalEmfScene`, and `MotionalEmfRig3D` to consume the new state shape.

**Tech Stack:** React, TypeScript, Vitest, Testing Library, existing `SceneLayout`/`InteractiveCanvas` classroom infrastructure.

---

### Task 1: Lock the new physics inputs with failing tests

**Files:**
- Modify: `src/scenes/motional-emf/model.test.ts`
- Modify: `src/scenes/motional-emf/useMotionalEmfSceneState.test.tsx`
- Modify: `src/scenes/motional-emf/__tests__/MotionalEmfControls.test.tsx`
- Modify: `src/scenes/motional-emf/__tests__/structure.test.tsx`
- Modify: `src/scenes/motional-emf/__tests__/classroomMode.test.tsx`

**Step 1: Write the failing tests**

Add tests that require:
- a discrete `L-v` preset set (`90° / 60° / 45° / 30°`);
- a forward/backward motion-sense toggle;
- derived angle readouts for `∠(B,L)`, `∠(L,v)`, `∠(B,v)`;
- classroom summary and control card text to show those angle readouts.

**Step 2: Run test to verify it fails**

Run:
```bash
npm test -- src/scenes/motional-emf/model.test.ts src/scenes/motional-emf/useMotionalEmfSceneState.test.tsx src/scenes/motional-emf/__tests__/MotionalEmfControls.test.tsx src/scenes/motional-emf/__tests__/structure.test.tsx src/scenes/motional-emf/__tests__/classroomMode.test.tsx
```
Expected: FAIL because the new `L-v` inputs and angle outputs do not exist yet.

**Step 3: Commit**

```bash
git add docs/plans/2026-03-10-motional-emf-lv-angle-implementation-plan.md src/scenes/motional-emf/model.test.ts src/scenes/motional-emf/useMotionalEmfSceneState.test.tsx src/scenes/motional-emf/__tests__/MotionalEmfControls.test.tsx src/scenes/motional-emf/__tests__/structure.test.tsx src/scenes/motional-emf/__tests__/classroomMode.test.tsx
git commit -m "test(motional-emf): add l-v angle coverage"
```

### Task 2: Refactor the pure model around explicit `L-v` control

**Files:**
- Modify: `src/scenes/motional-emf/model.ts`
- Test: `src/scenes/motional-emf/model.test.ts`

**Step 1: Write the minimal implementation**

Update the model to:
- replace the old `v`-to-`B` preset set with:
  - `MotionDirectionPreset = 'forward' | 'backward'`
  - `RodVelocityAnglePreset = 90 | 60 | 45 | 30`
- derive the velocity unit vector from the rod direction plus a fixed classroom-friendly forward axis;
- keep `signedVoltageV = (B × v) · L` as the final voltage calculation;
- expose angle readouts and formatters for the three teaching angles.

**Step 2: Run targeted tests**

Run:
```bash
npm test -- src/scenes/motional-emf/model.test.ts
```
Expected: PASS.

### Task 3: Thread the new state through the scene shell

**Files:**
- Modify: `src/scenes/motional-emf/useMotionalEmfSceneState.ts`
- Modify: `src/scenes/motional-emf/MotionalEmfControls.tsx`
- Modify: `src/scenes/motional-emf/MotionalEmfScene.tsx`
- Modify: `src/scenes/motional-emf/MotionalEmfRig3D.tsx`
- Test: `src/scenes/motional-emf/useMotionalEmfSceneState.test.tsx`
- Test: `src/scenes/motional-emf/__tests__/MotionalEmfControls.test.tsx`
- Test: `src/scenes/motional-emf/__tests__/structure.test.tsx`
- Test: `src/scenes/motional-emf/__tests__/classroomMode.test.tsx`

**Step 1: Implement the minimal React changes**

Update the state hook, controls, summary, and 3D rig so that:
- the UI can change `L-B` angle, `L-v` angle, field direction, and motion sense;
- the readout card always shows emf plus the three angle lines;
- `coreSummary` stays within 5 lines and remains readable in classroom mode;
- the motion arrow and induced current arrow follow the new velocity geometry.

**Step 2: Run scene-focused tests**

Run:
```bash
npm test -- src/scenes/motional-emf/useMotionalEmfSceneState.test.tsx src/scenes/motional-emf/__tests__/MotionalEmfControls.test.tsx src/scenes/motional-emf/__tests__/structure.test.tsx src/scenes/motional-emf/__tests__/classroomMode.test.tsx src/scenes/motional-emf/__tests__/cameraViews.test.tsx src/scenes/motional-emf/__tests__/frameloop.test.tsx
```
Expected: PASS.

### Task 4: Verify the full local contract before handoff

**Files:**
- Modify: none unless verification reveals a direct regression

**Step 1: Run verification**

Run:
```bash
npm test -- src/scenes/motional-emf
npm run build
```
Expected: PASS.

**Step 2: Optional visual check**

Run the dev server and inspect `/motional-emf` to confirm that the velocity arrow, wire motion, and angle readouts match the new teaching model.
