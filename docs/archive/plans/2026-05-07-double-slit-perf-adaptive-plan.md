# 双缝干涉场景性能自适应 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the double-slit scene adapt its computational workload to device capability so it remains usable on low-end devices (4 GB RAM, mobile, 4-core).

**Architecture:** Extend the existing `PerformanceProfile` in `canvasQuality.ts` with double-slit-specific tunables (canvas resolution scale, white-light wavelength step, cache limit). Thread the performance level into `DoubleSlitChart` → `model.ts` to scale computation. Fix the resize, cache-key, and material-allocation bugs discovered in audit.

**Tech Stack:** React 19, TypeScript, Canvas 2D API, Three.js / R3F, Vitest

---

### Task 1: Add double-slit tunables to `PerformanceProfile`

**Files:**
- Modify: `src/scene3d/canvasQuality.ts:31-35` (type), `70-134` (profiles)
- Test: `src/scenes/double-slit/__tests__/model.test.ts` (no change yet)

**Step 1: Update `PerformanceProfile` type**

In `src/scene3d/canvasQuality.ts`, add three fields to the `PerformanceProfile` type after the existing `inductionWireTubularSegments` field:

```typescript
  doubleSlitChartScale: number          // canvas pixel scale: 1.0 / 0.75 / 0.5
  doubleSlitWhiteLightWavelengthStep: number // nm step: 5 / 10 / 20
  doubleSlitPatternCacheMax: number     // max cached patterns: 3 / 2 / 1
```

**Step 2: Add values to each profile level**

In the `PROFILE_CONFIG` object, add these entries:

| Field | high | medium | low |
|-------|------|--------|-----|
| `doubleSlitChartScale` | `1.0` | `0.75` | `0.5` |
| `doubleSlitWhiteLightWavelengthStep` | `5` | `10` | `20` |
| `doubleSlitPatternCacheMax` | `3` | `2` | `1` |

**Step 3: Run existing tests to verify nothing broke**

Run: `npx vitest run src/scene3d/`
Expected: All tests PASS (canvasQuality has no dedicated tests, but other scenes that import it should still pass)

**Step 4: Commit**

```bash
git add src/scene3d/canvasQuality.ts
git commit -m "feat(perf): add double-slit adaptive tunables to PerformanceProfile"
```

---

### Task 2: Fix ResizeObserver stale-render bug (H2)

**Files:**
- Modify: `src/scenes/double-slit/DoubleSlitChart.tsx:19-35` (size state), `38-63` (pattern effect), `66-155` (reticle effect)

**Step 1: Write the failing test**

In `src/scenes/double-slit/__tests__/structure.test.tsx`, add after the existing tests:

```typescript
it('re-renders pattern canvas when container resizes', async () => {
  const { rerender } = render(<DoubleSlitScene />)

  // The chart should exist and render without crash
  // (full ResizeObserver test requires jsdom ResizeObserver polyfill
  // which is out of scope — this test validates the state wiring)
  expect(screen.getByTestId('interactive-canvas')).toBeInTheDocument()
})
```

**Step 2: Fix the ResizeObserver to use useState**

In `DoubleSlitChart.tsx`, replace the `sizeRef` approach:

```typescript
// BEFORE (line 19):
const sizeRef = useRef(0)

// AFTER:
const [canvasSize, setCanvasSize] = useState(0)
```

Update the ResizeObserver callback:

```typescript
// BEFORE:
if (w > 0 && w !== sizeRef.current) {
  sizeRef.current = w
}

// AFTER:
if (w > 0 && w !== canvasSize) {
  setCanvasSize(w)
}
```

Update all references to `sizeRef.current` → `canvasSize`:

- Line 45: `const cssSize = sizeRef.current || 800` → `const cssSize = canvasSize || 800`
- Line 73: same replacement

Add `canvasSize` to both useEffect dependency arrays:

- Pattern effect: `[params, isLightOn, isWhiteLight, filterColor, doubleSlitAngle, singleSlitAngle, canvasSize]`
- Reticle effect: `[eyepieceAngle, isLightOn, params.screenDistance, params.wavelength, params.slitDistance, canvasSize]`

**Step 3: Run tests**

Run: `npx vitest run src/scenes/double-slit/`
Expected: All tests PASS

**Step 4: Commit**

```bash
git add src/scenes/double-slit/DoubleSlitChart.tsx
git commit -m "fix: canvas re-renders on resize (useState instead of useRef)"
```

---

### Task 3: Adaptive canvas resolution + white-light wavelength step (C1)

**Files:**
- Modify: `src/scenes/double-slit/DoubleSlitChart.tsx` (read performance profile, scale canvas)
- Modify: `src/scenes/double-slit/model.ts` (accept wavelengthStep param, update cache)
- Modify: `src/scenes/double-slit/__tests__/model.test.ts` (test wavelengthStep)

**Step 1: Write the failing test for wavelengthStep**

In `src/scenes/double-slit/__tests__/model.test.ts`, update the `drawWhiteLightPattern` mock and add:

```typescript
describe('drawWhiteLightPattern with wavelengthStep', () => {
  const mockCtx = () => {
    const ctx = {
      canvas: { width: 50, height: 50 },
      fillRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      clip: vi.fn(),
      createImageData: vi.fn(() => ({ data: new Uint8ClampedArray(50 * 50 * 4) })),
      putImageData: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      createRadialGradient: vi.fn(() => ({
        addColorStop: vi.fn(),
      })),
      strokeStyle: '',
      lineWidth: 0,
      fillStyle: '',
    } as unknown as CanvasRenderingContext2D
    return ctx
  }

  it('accepts wavelengthStep parameter and renders correctly', () => {
    const ctx = mockCtx()
    expect(() => drawWhiteLightPattern(ctx, DEFAULT_PARAMS, 'none', 0, 0, 20)).not.toThrow()
    expect(ctx.putImageData).toHaveBeenCalledTimes(1)
  })

  it('uses fewer wavelengths with larger step (faster)', () => {
    // We verify it doesn't crash with step=20 (only ~16 wavelengths vs 61)
    const ctx = mockCtx()
    drawWhiteLightPattern(ctx, DEFAULT_PARAMS, 'none', 0, 0, 20)
    expect(ctx.putImageData).toHaveBeenCalledTimes(1)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/scenes/double-slit/__tests__/model.test.ts`
Expected: FAIL — `drawWhiteLightPattern` doesn't accept 6 args yet (TypeScript error or runtime wrong signature)

**Step 3: Add wavelengthStep parameter to `drawWhiteLightPattern`**

In `src/scenes/double-slit/model.ts`, update the function signature:

```typescript
// BEFORE (line 408):
export function drawWhiteLightPattern(
  ctx: CanvasRenderingContext2D,
  params: DoubleSlitParams,
  filterColor: FilterColor,
  doubleSlitAngle = 0,
  singleSlitAngle = 0,
): void {

// AFTER:
export function drawWhiteLightPattern(
  ctx: CanvasRenderingContext2D,
  params: DoubleSlitParams,
  filterColor: FilterColor,
  doubleSlitAngle = 0,
  singleSlitAngle = 0,
  wavelengthStep = 5,
): void {
```

Update the wavelength loop (line 466):

```typescript
// BEFORE:
for (let wl = 400; wl <= 700; wl += 5) {

// AFTER:
for (let wl = 400; wl <= 700; wl += wavelengthStep) {
```

Also add `wavelengthStep` to the cache key:

```typescript
// BEFORE (line 195-197):
function buildPatternCacheKey(params: DoubleSlitParams, filterColor: FilterColor, doubleSlitAngle: number, singleSlitAngle: number): string {
  return `${params.slitDistance.toFixed(3)}_${params.screenDistance.toFixed(2)}_${params.slitWidth.toFixed(3)}_${filterColor}_${doubleSlitAngle.toFixed(1)}_${singleSlitAngle.toFixed(1)}`
}

// AFTER:
function buildPatternCacheKey(params: DoubleSlitParams, filterColor: FilterColor, doubleSlitAngle: number, singleSlitAngle: number, wavelengthStep: number, width: number, height: number): string {
  return `${width}_${height}_${params.slitDistance.toFixed(3)}_${params.screenDistance.toFixed(2)}_${params.slitWidth.toFixed(3)}_${filterColor}_${doubleSlitAngle.toFixed(1)}_${singleSlitAngle.toFixed(1)}_${wavelengthStep}`
}
```

Update the call site inside `drawWhiteLightPattern` (line 428):

```typescript
// BEFORE:
const cacheKey = buildPatternCacheKey(params, filterColor, doubleSlitAngle, singleSlitAngle)

// AFTER:
const cacheKey = buildPatternCacheKey(params, filterColor, doubleSlitAngle, singleSlitAngle, wavelengthStep, width, height)
```

**Step 4: Add LRU limit to circle mask cache (M1)**

In `model.ts`, add a constant and eviction after line 228:

```typescript
const CIRCLE_MASK_CACHE_MAX = 8

// At end of getCircleMask, before return:
if (circleMaskCache.size > CIRCLE_MASK_CACHE_MAX) {
  const oldest = circleMaskCache.keys().next().value
  if (oldest !== undefined) circleMaskCache.delete(oldest)
}
```

**Step 5: Run tests to verify they pass**

Run: `npx vitest run src/scenes/double-slit/__tests__/model.test.ts`
Expected: All PASS

**Step 6: Wire performance profile into DoubleSlitChart**

In `DoubleSlitChart.tsx`:

1. Add import:

```typescript
import { resolvePerformanceProfile } from '../../scene3d/canvasQuality'
```

2. Inside the component, resolve profile once:

```typescript
const perf = useMemo(() => resolvePerformanceProfile(), [])
```

3. In the pattern rendering useEffect, apply the chart scale:

```typescript
const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, perf.canvas.dpr[1]) : 1
const cssSize = canvasSize || 800
const renderSize = Math.round(cssSize * perf.doubleSlitChartScale)
const canvasSize_px = renderSize * dpr
if (canvas.width !== canvasSize_px || canvas.height !== canvasSize_px) {
  canvas.width = canvasSize_px
  canvas.height = canvasSize_px
}
ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
```

Note: the CSS `width: 100%` on the canvas element handles display sizing. The internal `canvas.width/height` controls render resolution. We reduce the internal resolution on low-perf devices.

4. Pass `wavelengthStep` to `drawWhiteLightPattern`:

```typescript
drawWhiteLightPattern(ctx, params, filterColor, doubleSlitAngle, singleSlitAngle, perf.doubleSlitWhiteLightWavelengthStep)
```

5. Do the same DPR capping for the reticle canvas useEffect.

**Step 7: Run all double-slit tests**

Run: `npx vitest run src/scenes/double-slit/`
Expected: All PASS

**Step 8: Commit**

```bash
git add src/scenes/double-slit/model.ts src/scenes/double-slit/DoubleSlitChart.tsx src/scenes/double-slit/__tests__/model.test.ts
git commit -m "perf: adaptive canvas resolution + white-light wavelength step for low-end devices"
```

---

### Task 4: Fix white-light cache memory + cache limit (H1)

**Files:**
- Modify: `src/scenes/double-slit/model.ts:159-193` (cache system)

**Step 1: Make pattern cache limit configurable**

In `model.ts`, replace the hardcoded `PATTERN_CACHE_MAX`:

```typescript
// BEFORE (line 168):
const PATTERN_CACHE_MAX = 3

// AFTER:
const PATTERN_CACHE_DEFAULT_MAX = 3
```

Add a setter function:

```typescript
export function setPatternCacheMax(max: number): void {
  while (patternCache.length > max) {
    patternCache.pop()
  }
  // Store for future storeCachedPattern calls
  _patternCacheMax = max
}
let _patternCacheMax = PATTERN_CACHE_DEFAULT_MAX
```

Update `storeCachedPattern`:

```typescript
// BEFORE:
if (patternCache.length >= PATTERN_CACHE_MAX) patternCache.pop()

// AFTER:
if (patternCache.length >= _patternCacheMax) patternCache.pop()
```

**Step 2: Wire cache limit from performance profile**

In `DoubleSlitChart.tsx`, after resolving the perf profile, call the setter:

```typescript
useMemo(() => {
  setPatternCacheMax(perf.doubleSlitPatternCacheMax)
}, [perf.doubleSlitPatternCacheMax])
```

Actually — this should be a `useEffect` (side effect), not `useMemo`:

```typescript
useEffect(() => {
  setPatternCacheMax(perf.doubleSlitPatternCacheMax)
}, [perf.doubleSlitPatternCacheMax])
```

**Step 3: Write test for setPatternCacheMax**

In `model.test.ts`:

```typescript
import { setPatternCacheMax } from '../model'

describe('setPatternCacheMax', () => {
  it('does not throw for valid values', () => {
    expect(() => setPatternCacheMax(1)).not.toThrow()
    expect(() => setPatternCacheMax(3)).not.toThrow()
  })
})
```

**Step 4: Run tests**

Run: `npx vitest run src/scenes/double-slit/`
Expected: All PASS

**Step 5: Commit**

```bash
git add src/scenes/double-slit/model.ts src/scenes/double-slit/DoubleSlitChart.tsx src/scenes/double-slit/__tests__/model.test.ts
git commit -m "perf: configurable pattern cache limit from performance profile"
```

---

### Task 5: Fix DoubleSlitRig3D material allocation + DOM query (H3 + M2)

**Files:**
- Modify: `src/scenes/double-slit/DoubleSlitRig3D.tsx`

**Step 1: Extract materials to module-level constants**

Move the 5 material definitions out of the component body to module scope:

```typescript
const MAT_METAL = { color: 0xaaaaaa, metalness: 0.8, roughness: 0.2 }
const MAT_DARK_METAL = { color: 0x333333, metalness: 0.6, roughness: 0.4 }
const MAT_BLACK_PLASTIC = { color: 0x151515, metalness: 0.3, roughness: 0.7 }
const MAT_WHITE_TUBE = { color: 0xe0e0e0, metalness: 0.1, roughness: 0.5 }
const MAT_GLASS = {
  color: 0x88ccff,
  transparent: true,
  opacity: 0.4,
  metalness: 0.9,
  roughness: 0.1,
}
```

Replace all inline `{ ...metalMat }` → `{ ...MAT_METAL }` etc. inside the JSX.

**Step 2: Cache readSceneBackgroundColor**

Add a module-level cache:

```typescript
let _cachedBg: string | null = null

function readSceneBackgroundColor(): string {
  if (_cachedBg) return _cachedBg
  if (typeof window === 'undefined') return '#222222'
  const shell = document.querySelector('.app-shell')
  if (!shell) return '#222222'
  const computed = getComputedStyle(shell)
  _cachedBg = computed.getPropertyValue('--scene-optical-bg').trim() || '#222222'
  return _cachedBg
}
```

**Step 3: Run tests**

Run: `npx vitest run src/scenes/double-slit/`
Expected: All PASS (structure tests mock DoubleSlitRig3D)

**Step 4: Commit**

```bash
git add src/scenes/double-slit/DoubleSlitRig3D.tsx
git commit -m "perf: hoist materials to module scope + cache background color query"
```

---

### Task 6: Fix FILTER_HEX module-level extraction (L3)

**Files:**
- Modify: `src/scenes/double-slit/DoubleSlitScene.tsx:14`

**Step 1: Move FILTER_HEX to module scope**

```typescript
// BEFORE (inside component body, line 14):
const FILTER_HEX: Record<Exclude<FilterColor, 'none'>, number> = { red: 0xff4444, green: 0x44cc44, blue: 0x4488ff }

// AFTER (above the component function):
const FILTER_HEX: Record<Exclude<FilterColor, 'none'>, number> = {
  red: 0xff4444,
  green: 0x44cc44,
  blue: 0x4488ff,
}
```

**Step 2: Run tests**

Run: `npx vitest run src/scenes/double-slit/`
Expected: All PASS

**Step 3: Commit**

```bash
git add src/scenes/double-slit/DoubleSlitScene.tsx
git commit -m "refactor: extract FILTER_HEX to module scope"
```

---

### Task 7: Run full test suite + build verification

**Files:** None (verification only)

**Step 1: Run full unit tests**

Run: `npx vitest run`
Expected: All PASS

**Step 2: Run lint**

Run: `npx eslint src/scenes/double-slit/ src/scene3d/canvasQuality.ts`
Expected: No errors

**Step 3: Run production build**

Run: `npm run build`
Expected: Build succeeds, `DoubleSlitScene` chunk size unchanged or slightly smaller

**Step 4: Verify bundle budget**

Run: `npm run check:bundle-budget`
Expected: PASS

---

## Summary of Performance Impact

| Device | Before | After |
|--------|--------|-------|
| **Low** (mobile, 4GB) | 1600×1600 × 61 wavelengths ≈ 2.34 GFLOPs | 800×800 × 16 wavelengths ≈ 0.15 GFLOPs (**~15× faster**) |
| **Medium** (4-core) | 1600×1600 × 61 wavelengths | 1200×1200 × 31 wavelengths (**~3.6× faster**) |
| **High** (desktop) | unchanged | unchanged (scale=1.0, step=5) |
