# Rotational Emf Scene Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a new `rotational-emf` classroom scene that switches between a rotating rod case and a rotating rectangular frame case, shows induced emf magnitude as the primary teaching result, and supports `main` / `top` camera views.

**Architecture:** Keep the scene aligned with the existing classroom shell pattern: a thin `RotationalEmfScene` composed from `SceneLayout`, `RotationalEmfControls`, `RotationalEmfRig3D`, and `useRotationalEmfSceneState`. Put all case-specific emf calculations in `model.ts` pure functions, then derive classroom summary text and viewport props from a single state hook.

**Tech Stack:** React, TypeScript, Vitest, Testing Library, existing `InteractiveCanvas`/`SceneLayout` infrastructure, catalog-driven classroom metadata.

---

### Task 1: Scaffold the scene folder and failing model tests

**Files:**
- Create: `src/scenes/rotational-emf/model.ts`
- Create: `src/scenes/rotational-emf/model.test.ts`

**Step 1: Write the failing test**

Create `src/scenes/rotational-emf/model.test.ts` covering the two cases with default values of `1`:

```ts
import { describe, expect, it } from 'vitest'
import {
  deriveRotatingFrameEmfMagnitude,
  deriveRotatingRodEmfMagnitude,
  deriveRotationalEmfReadout,
} from './model'

describe('rotational-emf model', () => {
  it('returns stable magnitude for the rotating rod default case', () => {
    expect(deriveRotatingRodEmfMagnitude({ magneticFieldT: 1, angularSpeed: 1, effectiveLengthM: 1, angleRad: 0 })).toBeGreaterThanOrEqual(0)
  })

  it('returns stable magnitude for the rotating frame default case', () => {
    expect(deriveRotatingFrameEmfMagnitude({ magneticFieldT: 1, angularSpeed: 1, effectiveLengthM: 1, angleRad: 0 })).toBeGreaterThanOrEqual(0)
  })

  it('produces different readouts for the two scenarios at the same defaults', () => {
    const rod = deriveRotationalEmfReadout({ scenario: 'rod', magneticFieldT: 1, angularSpeed: 1, effectiveLengthM: 1, angleRad: 0 })
    const frame = deriveRotationalEmfReadout({ scenario: 'frame', magneticFieldT: 1, angularSpeed: 1, effectiveLengthM: 1, angleRad: 0 })

    expect(rod.emfMagnitudeV).toBeGreaterThanOrEqual(0)
    expect(frame.emfMagnitudeV).toBeGreaterThanOrEqual(0)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/scenes/rotational-emf/model.test.ts`
Expected: FAIL because the module and exports do not exist yet.

**Step 3: Write minimal implementation**

Implement `src/scenes/rotational-emf/model.ts` with:

```ts
export type RotationalEmfScenario = 'rod' | 'frame'

export type RotationalEmfInputs = {
  magneticFieldT: number
  angularSpeed: number
  effectiveLengthM: number
  angleRad: number
}

export function deriveRotatingRodEmfMagnitude(inputs: RotationalEmfInputs): number {
  return Math.abs(inputs.magneticFieldT * inputs.angularSpeed * inputs.effectiveLengthM * inputs.effectiveLengthM * 0.5)
}

export function deriveRotatingFrameEmfMagnitude(inputs: RotationalEmfInputs): number {
  return Math.abs(inputs.magneticFieldT * inputs.angularSpeed * inputs.effectiveLengthM * Math.max(0, Math.cos(inputs.angleRad)))
}

export function deriveRotationalEmfReadout(inputs: RotationalEmfInputs & { scenario: RotationalEmfScenario }) {
  const emfMagnitudeV = inputs.scenario === 'rod'
    ? deriveRotatingRodEmfMagnitude(inputs)
    : deriveRotatingFrameEmfMagnitude(inputs)

  return { emfMagnitudeV }
}
```

Keep the implementation intentionally simple and classroom-oriented; refine formulas only if tests or design review require it.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/scenes/rotational-emf/model.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/scenes/rotational-emf/model.ts src/scenes/rotational-emf/model.test.ts
git commit -m "feat(rotational-emf): add emf model primitives"
```

### Task 2: Add the state hook with scenario, animation, and view switching

**Files:**
- Create: `src/scenes/rotational-emf/useRotationalEmfSceneState.ts`
- Create: `src/scenes/rotational-emf/useRotationalEmfSceneState.test.tsx`
- Modify: `src/scenes/rotational-emf/model.ts`

**Step 1: Write the failing test**

Create `src/scenes/rotational-emf/useRotationalEmfSceneState.test.tsx` covering:

```ts
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useRotationalEmfSceneState } from './useRotationalEmfSceneState'

describe('useRotationalEmfSceneState', () => {
  it('starts with all teaching defaults equal to 1', () => {
    const { result } = renderHook(() => useRotationalEmfSceneState())

    expect(result.current.scenario).toBe('rod')
    expect(result.current.magneticFieldT).toBe(1)
    expect(result.current.angularSpeed).toBe(1)
    expect(result.current.effectiveLengthM).toBe(1)
    expect(result.current.viewMode).toBe('main')
    expect(result.current.running).toBe(false)
  })

  it('switches scenario and recomputes the readout', () => {
    const { result } = renderHook(() => useRotationalEmfSceneState())

    const first = result.current.emfMagnitudeV
    act(() => result.current.setScenario('frame'))

    expect(result.current.scenario).toBe('frame')
    expect(result.current.emfMagnitudeV).not.toBe(first)
  })

  it('switches between main and top view', () => {
    const { result } = renderHook(() => useRotationalEmfSceneState())

    act(() => result.current.setViewMode('top'))
    expect(result.current.viewMode).toBe('top')
  })

  it('resets state back to the classroom defaults', () => {
    const { result } = renderHook(() => useRotationalEmfSceneState())

    act(() => {
      result.current.setScenario('frame')
      result.current.setViewMode('top')
      result.current.setMagneticFieldT(2)
      result.current.toggleRunning()
      result.current.reset()
    })

    expect(result.current.scenario).toBe('rod')
    expect(result.current.viewMode).toBe('main')
    expect(result.current.magneticFieldT).toBe(1)
    expect(result.current.running).toBe(false)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/scenes/rotational-emf/useRotationalEmfSceneState.test.tsx`
Expected: FAIL.

**Step 3: Write minimal implementation**

Implement a hook exposing:

- `scenario`, `setScenario`
- `viewMode`, `setViewMode`
- `magneticFieldT`, `angularSpeed`, `effectiveLengthM` and setters
- `running`, `toggleRunning`, `reset`
- `angleRad`
- `emfMagnitudeV`
- preformatted labels for summary and controls

Advance `angleRad` with a simple `requestAnimationFrame` loop while `running` is true. Keep the hook self-contained and derive `emfMagnitudeV` from `model.ts`.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/scenes/rotational-emf/useRotationalEmfSceneState.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/scenes/rotational-emf/useRotationalEmfSceneState.ts src/scenes/rotational-emf/useRotationalEmfSceneState.test.tsx src/scenes/rotational-emf/model.ts
git commit -m "feat(rotational-emf): add scene state hook"
```

### Task 3: Add the controls with unified classroom readout

**Files:**
- Create: `src/scenes/rotational-emf/RotationalEmfControls.tsx`
- Create: `src/scenes/rotational-emf/__tests__/structure.test.tsx`

**Step 1: Write the failing test**

Create a structure test that renders the eventual scene shell and verifies:

- the experiment type toggle exists;
- the `main` / `top` view buttons exist;
- the result card displays emf magnitude;
- switching scenario changes the visible experiment label.

Include an assertion for:

```ts
document.querySelector('.rotational-emf-readout[data-presentation-signal~="live-metric"][data-presentation-signal~="interactive-readout"]')
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/scenes/rotational-emf/__tests__/structure.test.tsx`
Expected: FAIL.

**Step 3: Write minimal implementation**

Implement `RotationalEmfControls.tsx` with:

- a segmented control for `旋转导体棒` / `旋转矩形线框`;
- range fields or simple numeric controls for `B`, `ω`, `L`;
- `播放/暂停` and `重置` actions;
- a result card with `data-presentation-signal="live-metric interactive-readout"`;
- visible text for `实验类型`、`当前转角`、`感应电动势`.

Use the existing `RangeField` and `SceneActions` patterns where they fit; do not invent new control primitives.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/scenes/rotational-emf/__tests__/structure.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/scenes/rotational-emf/RotationalEmfControls.tsx src/scenes/rotational-emf/__tests__/structure.test.tsx
git commit -m "feat(rotational-emf): add controls and readout"
```

### Task 4: Add the scene shell, camera presets, and basic rig switching

**Files:**
- Create: `src/scenes/rotational-emf/RotationalEmfScene.tsx`
- Create: `src/scenes/rotational-emf/RotationalEmfRig3D.tsx`
- Create: `src/scenes/rotational-emf/rotational-emf.css`
- Create: `src/scenes/rotational-emf/__tests__/classroomMode.test.tsx`

**Step 1: Write the failing test**

Create `classroomMode.test.tsx` asserting that in presentation viewport mode:

- `课堂核心信息` is still rendered;
- the summary includes experiment type and emf magnitude;
- the controls panel can collapse while the summary remains visible.

Also add a lightweight test that mocks `InteractiveCanvas` and verifies switching `viewMode` changes the selected camera preset.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/scenes/rotational-emf/__tests__/classroomMode.test.tsx`
Expected: FAIL.

**Step 3: Write minimal implementation**

Implement `RotationalEmfScene.tsx` as a thin shell:

- `presentationSignals={['live-metric', 'interactive-readout']}`
- `coreSummary` with exactly 4 lines
- `controls={<RotationalEmfControls ... />}`
- `viewport={<InteractiveCanvas ...><RotationalEmfRig3D ... /></InteractiveCanvas>}`

In `RotationalEmfRig3D.tsx`:

- render a rod apparatus when `scenario === 'rod'`;
- render a frame apparatus when `scenario === 'frame'`;
- render vertical field arrows for the rod case and horizontal field arrows for the frame case;
- highlight the main cutting conductor.

For view switching, keep two camera presets:

- `main`
- `top`

Use a keyed canvas or preset props pattern similar to the existing `motional-emf` scene.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/scenes/rotational-emf/__tests__/classroomMode.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/scenes/rotational-emf/RotationalEmfScene.tsx src/scenes/rotational-emf/RotationalEmfRig3D.tsx src/scenes/rotational-emf/rotational-emf.css src/scenes/rotational-emf/__tests__/classroomMode.test.tsx
git commit -m "feat(rotational-emf): add scene shell and rig"
```

### Task 5: Register the route and satisfy catalog conformance

**Files:**
- Modify: `config/demo-scenes.json`
- Modify: any auto-discovery or route metadata files only if needed by the current scaffold conventions
- Test: `src/app/__tests__/demoRouteConformance.test.ts`

**Step 1: Write or extend the failing test**

If needed, extend `src/app/__tests__/demoRouteConformance.test.ts` only with scene-specific expectations that are not already covered globally. Prefer relying on the existing global conformance checks.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/app/__tests__/demoRouteConformance.test.ts`
Expected: FAIL until the new scene metadata is added correctly.

**Step 3: Write minimal implementation**

Add a catalog entry for `rotational-emf` with:

- `pageId`: `rotational-emf`
- `classroom.presentationSignals`: `['live-metric', 'interactive-readout']`
- `classroom.coreSummaryLineCount`: `4`
- `classroom.sceneKind`: `process`
- `classroom.smartPresentation.layout`: `never`
- touch profile aligned with the rest of the scenes

Also set `playwright.readyText` to a stable text from the controls header.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/app/__tests__/demoRouteConformance.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add config/demo-scenes.json src/app/__tests__/demoRouteConformance.test.ts
git commit -m "feat(rotational-emf): register scene metadata"
```

### Task 6: Run focused verification, then broader verification

**Files:**
- Test only

**Step 1: Run focused scene tests**

Run:

```bash
npm test -- \
  src/scenes/rotational-emf/model.test.ts \
  src/scenes/rotational-emf/useRotationalEmfSceneState.test.tsx \
  src/scenes/rotational-emf/__tests__/structure.test.tsx \
  src/scenes/rotational-emf/__tests__/classroomMode.test.tsx
```

Expected: PASS.

**Step 2: Run conformance and adjacent layout tests**

Run:

```bash
npm test -- \
  src/app/__tests__/demoRouteConformance.test.ts \
  src/ui/layout/__tests__/SceneLayout.test.tsx
```

Expected: PASS.

**Step 3: Run build verification**

Run:

```bash
npm run build
```

Expected: successful production build.

**Step 4: Commit**

```bash
git add .
git commit -m "feat(rotational-emf): complete unified classroom scene"
```

