# Five-Zone Layout Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the two-panel split layout with a five-zone layout (animation full-screen, sidebar parameters, floating data/chart/playback panels) using Tailwind CSS, removing the presentation mode system entirely.

**Architecture:** The 3D canvas fills the entire viewport as the base layer. A left sidebar holds parameter controls. Three floating draggable panels (data, chart, playback) overlay the canvas. All panels except the canvas support collapse/expand. The existing `presentationDirector` signal-scoring system is fully removed.

**Tech Stack:** React 19, Tailwind CSS 4, Three.js/R3F (unchanged), Zustand (simplified), Vitest, Playwright

---

## Phase 1: Install Tailwind CSS

### Task 1: Install and configure Tailwind CSS

**Files:**
- Create: `src/styles/tailwind.css`
- Modify: `vite.config.ts`
- Modify: `src/main.tsx`

**Step 1: Install Tailwind CSS and its Vite plugin**

Run: `npm install tailwindcss @tailwindcss/vite`

**Step 2: Create the Tailwind entry CSS**

Create `src/styles/tailwind.css`:

```css
@import "tailwindcss";
```

**Step 3: Add the Vite plugin to vite.config.ts**

In `vite.config.ts`, import the plugin and add it to the plugins array (BEFORE the react plugin):

```ts
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
// ...
plugins: [tailwindcss(), react()],
```

**Step 4: Import Tailwind CSS in main.tsx**

In `src/main.tsx`, add the import at the top (before other CSS imports):

```ts
import './styles/tailwind.css'
```

**Step 5: Verify Tailwind is working**

Run: `npm run build`
Expected: Build succeeds with no errors.

Add a temporary `className="bg-red-500"` to any element in a scene, run `npm run dev`, and confirm the red background appears in the browser. Then remove the test class.

**Step 6: Commit**

```bash
git add -A
git commit -m "chore: install and configure Tailwind CSS"
```

---

## Phase 2: Remove Presentation Mode System

### Task 2: Remove presentation-related state from Zustand store

**Files:**
- Modify: `src/store/useAppStore.ts`

**Step 1: Write failing test**

Create `src/store/__tests__/useAppStore.no-presentation.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { useAppStore } from '../useAppStore'

describe('useAppStore presentation removal', () => {
  it('does not have presentationMode in state', () => {
    const state = useAppStore.getState()
    expect('presentationMode' in state).toBe(false)
  })

  it('does not have presentationRouteModes in state', () => {
    const state = useAppStore.getState()
    expect('presentationRouteModes' in state).toBe(false)
  })

  it('does not have nightTone in state', () => {
    const state = useAppStore.getState()
    expect('nightTone' in state).toBe(false)
  })

  it('does not have setPresentationMode setter', () => {
    const state = useAppStore.getState()
    expect('setPresentationMode' in state).toBe(false)
  })

  it('does not have setPresentationRouteMode setter', () => {
    const state = useAppStore.getState()
    expect('setPresentationRouteMode' in state).toBe(false)
  })

  it('does not have setNightTone setter', () => {
    const state = useAppStore.getState()
    expect('setNightTone' in state).toBe(false)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/store/__tests__/useAppStore.no-presentation.test.ts`
Expected: FAIL — state still has `presentationMode`, `nightTone`, etc.

**Step 3: Modify useAppStore.ts**

Remove the following from `src/store/useAppStore.ts`:

- Line 5: `export type NightTone = 'minimal' | 'neon'`
- Line 6: `export type PresentationLayoutMode = 'auto' | 'split' | 'viewport'`
- Lines 10, 13: `nightTone`, `presentationMode`, `presentationRouteModes` from `AppState` type
- Lines 15, 18: `setNightTone`, `setPresentationMode`, `setPresentationRouteMode` from `AppState`
- Lines 21-24: Update `PersistedAppState` to `Pick<AppState, 'theme'>`
- Lines 71-73: Delete `sanitizeNightTone` function
- Lines 75-77: Delete `sanitizePresentationMode` function
- Lines 79-100: Delete `sanitizePresentationRouteModes` function
- Lines 53-65: Delete `normalizePersistedRoutePath` function
- Lines 102-108: Update `pickPersistedAppState` to only pick `theme`
- Lines 111-125: Update `sanitizePersistedAppState` to only validate `theme`
- Lines 149, 152, 154, 155, 157-167: Remove `nightTone`, `presentationMode`, `presentationRouteModes` initial state and setters
- Lines 174-176: Update `partialize` to only include `theme`

The simplified store should be:

```ts
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type ThemeMode = 'day' | 'night'

type AppState = {
  theme: ThemeMode
  activeScenePath: string
  setTheme: (theme: ThemeMode) => void
  setActiveScenePath: (path: string) => void
}

type PersistedAppState = Pick<AppState, 'theme'>

type BasicStorage = {
  getItem: (name: string) => string | null
  setItem: (name: string, value: string) => void
  removeItem: (name: string) => void
}

const memoryStorageMap = new Map<string, string>()

const memoryStorage: BasicStorage = {
  getItem: (name) => memoryStorageMap.get(name) ?? null,
  setItem: (name, value) => memoryStorageMap.set(name, value),
  removeItem: (name) => memoryStorageMap.delete(name),
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isTestRuntime(): boolean {
  const viteEnv = (import.meta as { env?: Record<string, unknown> }).env
  return Boolean(viteEnv && (viteEnv.MODE === 'test' || viteEnv.VITEST === true))
}

function sanitizeThemeMode(value: unknown, fallback: ThemeMode): ThemeMode {
  return value === 'day' || value === 'night' ? value : fallback
}

function pickPersistedAppState(state: AppState): PersistedAppState {
  return {
    theme: sanitizeThemeMode(state.theme, 'day'),
  }
}

function sanitizePersistedAppState(value: unknown, fallback: PersistedAppState): PersistedAppState {
  if (!isRecord(value)) return fallback
  return {
    theme: sanitizeThemeMode(value.theme, fallback.theme),
  }
}

const resolveStorage = (): BasicStorage => {
  if (typeof window === 'undefined' || isTestRuntime()) return memoryStorage
  const storage = window.localStorage as Partial<BasicStorage> | undefined
  if (storage && typeof storage.getItem === 'function' && typeof storage.setItem === 'function' && typeof storage.removeItem === 'function') {
    return storage as BasicStorage
  }
  return memoryStorage
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'day',
      activeScenePath: '/',
      setTheme: (theme) => set({ theme }),
      setActiveScenePath: (path) => set({ activeScenePath: path }),
    }),
    {
      name: 'electromagnetics-lab-ui',
      storage: createJSONStorage(resolveStorage),
      partialize: (state) => ({ theme: state.theme }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...sanitizePersistedAppState(persistedState, pickPersistedAppState(currentState)),
      }),
    },
  ),
)
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/store/__tests__/useAppStore.no-presentation.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/store/useAppStore.ts src/store/__tests__/useAppStore.no-presentation.test.ts
git commit -m "refactor(store): remove presentation mode and night tone state"
```

---

### Task 3: Remove presentation files

**Files:**
- Delete: `src/ui/layout/presentationDirector.ts`
- Delete: `src/ui/layout/usePresentationDirector.ts`
- Delete: `src/ui/layout/usePresentationStrategy.ts`
- Delete: `src/ui/layout/presentationSignals.ts`
- Delete: `src/ui/layout/useResizableSplitPanel.ts`
- Delete: All 12 `src/scenes/*/__tests__/classroomMode.test.tsx`

**Step 1: Delete the presentation layout files**

Run:
```bash
rm src/ui/layout/presentationDirector.ts
rm src/ui/layout/usePresentationDirector.ts
rm src/ui/layout/usePresentationStrategy.ts
rm src/ui/layout/presentationSignals.ts
rm src/ui/layout/useResizableSplitPanel.ts
```

**Step 2: Delete all classroomMode test files**

Run:
```bash
find src/scenes -name "classroomMode.test.tsx" -delete
```

**Step 3: Verify build still passes (it will fail on imports — that's expected, we fix those next)**

Run: `npm run build 2>&1 | head -30`
Expected: Build fails with import errors from files still referencing deleted modules. We'll fix these in Tasks 4-5.

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor(layout): delete presentation mode engine and classroom mode tests"
```

---

### Task 4: Simplify layoutPolicy.ts

**Files:**
- Modify: `src/ui/layout/layoutPolicy.ts`

**Step 1: Write the failing test**

Create `src/ui/layout/__tests__/layoutPolicy.simplified.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { resolveLayoutTier, clamp } from '../layoutPolicy'

describe('layoutPolicy simplified', () => {
  describe('resolveLayoutTier', () => {
    it('returns mobile for width < 768', () => {
      expect(resolveLayoutTier(500)).toBe('mobile')
      expect(resolveLayoutTier(767)).toBe('mobile')
    })

    it('returns tablet for 768 <= width < 1200', () => {
      expect(resolveLayoutTier(768)).toBe('tablet')
      expect(resolveLayoutTier(1199)).toBe('tablet')
    })

    it('returns desktop for width >= 1200', () => {
      expect(resolveLayoutTier(1200)).toBe('desktop')
      expect(resolveLayoutTier(1920)).toBe('desktop')
    })
  })

  describe('clamp', () => {
    it('clamps value within bounds', () => {
      expect(clamp(5, 0, 10)).toBe(5)
      expect(clamp(-1, 0, 10)).toBe(0)
      expect(clamp(15, 0, 10)).toBe(10)
    })
  })

  it('does not export isPresentationSplit', async () => {
    const mod = await import('../layoutPolicy')
    expect('isPresentationSplit' in mod).toBe(false)
  })

  it('does not export resolvePreferredLeftWidthPx', async () => {
    const mod = await import('../layoutPolicy')
    expect('resolvePreferredLeftWidthPx' in mod).toBe(false)
  })

  it('does not export resolveLeftPanelBounds', async () => {
    const mod = await import('../layoutPolicy')
    expect('resolveLeftPanelBounds' in mod).toBe(false)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/ui/layout/__tests__/layoutPolicy.simplified.test.ts`
Expected: FAIL — `isPresentationSplit` etc. still exist.

**Step 3: Simplify layoutPolicy.ts**

Replace `src/ui/layout/layoutPolicy.ts` with:

```ts
export type LayoutTier = 'desktop' | 'tablet' | 'mobile'

export const DEFAULT_LEFT_PANEL_WIDTH_PX = 320
export const MIN_VIEWPORT_WIDTH_PX = 320

export function resolveLayoutTier(width: number): LayoutTier {
  if (width >= 1200) return 'desktop'
  if (width >= 768) return 'tablet'
  return 'mobile'
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/ui/layout/__tests__/layoutPolicy.simplified.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/ui/layout/layoutPolicy.ts src/ui/layout/__tests__/layoutPolicy.simplified.test.ts
git commit -m "refactor(layout): simplify layoutPolicy to tier resolution only"
```

---

### Task 5: Simplify App.tsx and useGlobalShortcuts.ts

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/app/useGlobalShortcuts.ts`

**Step 1: Simplify useGlobalShortcuts.ts**

Remove presentation-mode and night-tone related params and key handlers. Replace the file with:

```ts
import { useEffect } from 'react'
import type { DemoRoute } from './demoRoutes'
import type { ThemeMode } from '../store/useAppStore'
import { safePreload } from './safePreload'

type UseGlobalShortcutsOptions = {
  routes: DemoRoute[]
  pathname: string
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  navigateTo: (path: string) => void
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tagName = target.tagName
  return target.isContentEditable || tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT'
}

export function useGlobalShortcuts({
  routes,
  pathname,
  theme,
  setTheme,
  navigateTo,
}: UseGlobalShortcutsOptions): void {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return

      const key = event.key.toLowerCase()
      if (key === 'd') { event.preventDefault(); setTheme('day'); return }
      if (key === 'n') { event.preventDefault(); setTheme('night'); return }
      if (key === 'p') { event.preventDefault(); /* TODO: toggle all panels collapse/expand */ return }

      if (pathname === '/' && /^[1-9]$/.test(key)) {
        const nextRoute = routes[Number(key) - 1]
        if (nextRoute) { event.preventDefault(); safePreload(nextRoute.preload); navigateTo(nextRoute.path) }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [navigateTo, pathname, routes, setTheme, theme])
}
```

**Step 2: Simplify App.tsx**

Remove all presentation-mode and night-tone related code from `src/App.tsx`:

- Remove `PRESENTATION_LAYOUT_OPTIONS` array (lines 18-22)
- Remove store selectors for `nightTone`, `presentationMode`, `presentationRouteModes`, `setNightTone`, `setPresentationMode`, `setPresentationRouteMode` (lines 38-45 → keep only `theme`, `setTheme`, `setActiveScenePath`)
- Remove derived values: `presentationLayoutMode`, `presentationLayoutLabel`, `canConfigurePresentationLayout` (lines 113-116)
- Update `useGlobalShortcuts` call to remove presentation/night-tone params (line 101-110)
- Remove night-tone switch UI (lines 185-206)
- Remove presentation toggle button (lines 207-215)
- Remove presentation indicator (lines 216-220)
- Remove presentation layout switch (lines 221-234)
- Remove `night-tone-${nightTone}` from `shellClassName` (line 129)
- Remove `presentationMode ? 'presentation-mode' : ''` from `shellClassName` (line 128)

The header section should simplify to just: navigation button + theme switch (day/night).

**Step 3: Verify build passes**

Run: `npm run build`
Expected: Build may still fail on SceneLayout imports — that's expected, fixed in Phase 3.

**Step 4: Commit**

```bash
git add src/App.tsx src/app/useGlobalShortcuts.ts
git commit -m "refactor(app): remove presentation mode and night tone UI and shortcuts"
```

---

### Task 6: Remove classroom field from demo-scenes.json

**Files:**
- Modify: `config/demo-scenes.json`

**Step 1: Remove the `classroom` key from all 12 entries**

In `config/demo-scenes.json`, delete the `"classroom": { ... }` block from every scene entry. Each entry should only have: `pageId`, `label`, `meta`, `touchProfile`, `playwright`.

**Step 2: Verify JSON is valid**

Run: `node -e "JSON.parse(require('fs').readFileSync('config/demo-scenes.json','utf8')); console.log('valid')"`
Expected: `valid`

**Step 3: Commit**

```bash
git add config/demo-scenes.json
git commit -m "refactor(config): remove classroom presentation metadata from scene catalog"
```

---

## Phase 3: Build New Layout Components

### Task 7: Implement useDraggable hook

**Files:**
- Create: `src/ui/hooks/useDraggable.ts`
- Create: `src/ui/hooks/__tests__/useDraggable.test.ts`

**Step 1: Write the failing test**

```ts
// src/ui/hooks/__tests__/useDraggable.test.ts
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDraggable } from '../useDraggable'

describe('useDraggable', () => {
  it('returns initial position', () => {
    const { result } = renderHook(() => useDraggable({ initialPosition: { x: 100, y: 200 } }))
    expect(result.current.position).toEqual({ x: 100, y: 200 })
  })

  it('returns a transform style', () => {
    const { result } = renderHook(() => useDraggable({ initialPosition: { x: 50, y: 75 } }))
    expect(result.current.style.transform).toBe('translate(50px, 75px)')
  })

  it('returns pointer down handler', () => {
    const { result } = renderHook(() => useDraggable({ initialPosition: { x: 0, y: 0 } }))
    expect(typeof result.current.handlers.onPointerDown).toBe('function')
  })

  it('allows setting position externally', () => {
    const { result } = renderHook(() => useDraggable({ initialPosition: { x: 0, y: 0 } }))
    act(() => result.current.setPosition({ x: 300, y: 400 }))
    expect(result.current.position).toEqual({ x: 300, y: 400 })
    expect(result.current.style.transform).toBe('translate(300px, 400px)')
  })

  it('clamps position within bounds', () => {
    const { result } = renderHook(() =>
      useDraggable({ initialPosition: { x: 0, y: 0 }, bounds: { left: 0, top: 0, right: 500, bottom: 500 } })
    )
    act(() => result.current.setPosition({ x: 600, y: -100 }))
    expect(result.current.position).toEqual({ x: 500, y: 0 })
  })

  it('defaults position to 0,0', () => {
    const { result } = renderHook(() => useDraggable())
    expect(result.current.position).toEqual({ x: 0, y: 0 })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/ui/hooks/__tests__/useDraggable.test.ts`
Expected: FAIL — module not found.

**Step 3: Implement useDraggable**

Create `src/ui/hooks/useDraggable.ts`:

```ts
import { useCallback, useRef, useState, type CSSProperties, type PointerEventHandler } from 'react'

type Position = { x: number; y: number }

type DragBounds = {
  left?: number
  top?: number
  right?: number
  bottom?: number
}

type UseDraggableOptions = {
  initialPosition?: Position
  bounds?: DragBounds
}

type UseDraggableReturn = {
  style: CSSProperties
  handlers: { onPointerDown: PointerEventHandler }
  position: Position
  setPosition: (pos: Position) => void
}

function clampPos(pos: Position, bounds: DragBounds | undefined): Position {
  if (!bounds) return pos
  return {
    x: Math.max(bounds.left ?? -Infinity, Math.min(bounds.right ?? Infinity, pos.x)),
    y: Math.max(bounds.top ?? -Infinity, Math.min(bounds.bottom ?? Infinity, pos.y)),
  }
}

export function useDraggable(options?: UseDraggableOptions): UseDraggableReturn {
  const { initialPosition = { x: 0, y: 0 }, bounds } = options ?? {}
  const [position, setPositionRaw] = useState<Position>(initialPosition)
  const dragRef = useRef<{ startPointer: Position; startPos: Position } | null>(null)

  const setPosition = useCallback(
    (pos: Position) => setPositionRaw(clampPos(pos, bounds)),
    [bounds],
  )

  const onPointerDown: PointerEventHandler = useCallback(
    (event) => {
      const target = event.currentTarget as HTMLElement
      target.setPointerCapture(event.pointerId)
      dragRef.current = { startPointer: { x: event.clientX, y: event.clientY }, startPos: position }
    },
    [position],
  )

  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      if (!dragRef.current) return
      const dx = event.clientX - dragRef.current.startPointer.x
      const dy = event.clientY - dragRef.current.startPointer.y
      const next = clampPos(
        { x: dragRef.current.startPos.x + dx, y: dragRef.current.startPos.y + dy },
        bounds,
      )
      setPositionRaw(next)
    },
    [bounds],
  )

  const onPointerUp = useCallback(() => {
    dragRef.current = null
  }, [])

  // Attach move/up to window for captured pointer
  const originalOnPointerDown = onPointerDown
  const wrappedOnPointerDown: PointerEventHandler = useCallback(
    (event) => {
      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', onPointerUp, { once: true })
      originalOnPointerDown(event)
    },
    [originalOnPointerDown, onPointerMove, onPointerUp],
  )

  return {
    style: { transform: `translate(${position.x}px, ${position.y}px)` },
    handlers: { onPointerDown: wrappedOnPointerDown },
    position,
    setPosition,
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/ui/hooks/__tests__/useDraggable.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/ui/hooks/useDraggable.ts src/ui/hooks/__tests__/useDraggable.test.ts
git commit -m "feat(ui): add useDraggable hook for floating panel drag support"
```

---

### Task 8: Implement FloatingPanel component

**Files:**
- Create: `src/ui/panels/FloatingPanel.tsx`
- Create: `src/ui/panels/__tests__/FloatingPanel.test.tsx`

**Step 1: Write the failing test**

```tsx
// src/ui/panels/__tests__/FloatingPanel.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FloatingPanel } from '../FloatingPanel'

describe('FloatingPanel', () => {
  it('renders title', () => {
    render(<FloatingPanel title="数据面板" defaultPosition={{ x: 0, y: 0 }}>content</FloatingPanel>)
    expect(screen.getByText('数据面板')).toBeInTheDocument()
  })

  it('renders children when expanded', () => {
    render(<FloatingPanel title="Test" defaultPosition={{ x: 0, y: 0 }}>panel body</FloatingPanel>)
    expect(screen.getByText('panel body')).toBeInTheDocument()
  })

  it('hides children when collapsed', () => {
    render(
      <FloatingPanel title="Test" defaultPosition={{ x: 0, y: 0 }} defaultCollapsed>
        panel body
      </FloatingPanel>,
    )
    expect(screen.queryByText('panel body')).not.toBeInTheDocument()
  })

  it('shows collapse button', () => {
    render(<FloatingPanel title="Test" defaultPosition={{ x: 0, y: 0 }}>body</FloatingPanel>)
    expect(screen.getByRole('button', { name: /折叠/i })).toBeInTheDocument()
  })

  it('toggles collapse on button click', () => {
    render(<FloatingPanel title="Test" defaultPosition={{ x: 0, y: 0 }}>panel body</FloatingPanel>)
    const btn = screen.getByRole('button', { name: /折叠/i })
    fireEvent.click(btn)
    expect(screen.queryByText('panel body')).not.toBeInTheDocument()
  })

  it('shows close button when closable', () => {
    render(
      <FloatingPanel title="Test" defaultPosition={{ x: 0, y: 0 }} closable onClose={() => {}}>
        body
      </FloatingPanel>,
    )
    expect(screen.getByRole('button', { name: /关闭/i })).toBeInTheDocument()
  })

  it('does not show close button when not closable', () => {
    render(<FloatingPanel title="Test" defaultPosition={{ x: 0, y: 0 }}>body</FloatingPanel>)
    expect(screen.queryByRole('button', { name: /关闭/i })).not.toBeInTheDocument()
  })

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn()
    render(
      <FloatingPanel title="Test" defaultPosition={{ x: 0, y: 0 }} closable onClose={onClose}>
        body
      </FloatingPanel>,
    )
    fireEvent.click(screen.getByRole('button', { name: /关闭/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/ui/panels/__tests__/FloatingPanel.test.tsx`
Expected: FAIL — module not found.

**Step 3: Implement FloatingPanel**

Create `src/ui/panels/FloatingPanel.tsx`:

```tsx
import { useState, type ReactNode, type CSSProperties } from 'react'
import { useDraggable } from '../hooks/useDraggable'

type FloatingPanelProps = {
  title: string
  icon?: ReactNode
  defaultPosition: { x: number; y: number }
  defaultCollapsed?: boolean
  closable?: boolean
  onClose?: () => void
  zIndex?: 'z-10' | 'z-20'
  children: ReactNode
}

export function FloatingPanel({
  title,
  icon,
  defaultPosition,
  defaultCollapsed = false,
  closable = false,
  onClose,
  zIndex = 'z-10',
  children,
}: FloatingPanelProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const { style, handlers } = useDraggable({ initialPosition: defaultPosition })

  return (
    <div
      className={`absolute ${zIndex} flex flex-col rounded-lg shadow-lg bg-white/90 backdrop-blur-sm border border-gray-200 select-none`}
      style={style as CSSProperties}
    >
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-grab active:cursor-grabbing"
        {...handlers}
      >
        {icon}
        <span className="text-sm font-medium">{title}</span>
        <button
          className="ml-auto text-xs text-gray-500 hover:text-gray-700"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? '展开' : '折叠'}
        >
          {collapsed ? '▼' : '▲'}
        </button>
        {closable && onClose && (
          <button
            className="text-xs text-gray-500 hover:text-gray-700"
            onClick={onClose}
            aria-label="关闭"
          >
            ✕
          </button>
        )}
      </div>
      <div
        className={`grid transition-all duration-200 ${collapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'}`}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  )
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/ui/panels/__tests__/FloatingPanel.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/ui/panels/FloatingPanel.tsx src/ui/panels/__tests__/FloatingPanel.test.tsx
git commit -m "feat(ui): add FloatingPanel component with collapse and drag"
```

---

### Task 9: Implement SidebarPanel component

**Files:**
- Create: `src/ui/panels/SidebarPanel.tsx`
- Create: `src/ui/panels/__tests__/SidebarPanel.test.tsx`

**Step 1: Write the failing test**

```tsx
// src/ui/panels/__tests__/SidebarPanel.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SidebarPanel } from '../SidebarPanel'

describe('SidebarPanel', () => {
  it('renders children when expanded', () => {
    render(<SidebarPanel>sidebar body</SidebarPanel>)
    expect(screen.getByText('sidebar body')).toBeInTheDocument()
  })

  it('hides children when collapsed', () => {
    render(<SidebarPanel defaultCollapsed>sidebar body</SidebarPanel>)
    expect(screen.queryByText('sidebar body')).not.toBeInTheDocument()
  })

  it('shows expand button when collapsed', () => {
    render(<SidebarPanel defaultCollapsed>body</SidebarPanel>)
    expect(screen.getByRole('button', { name: /展开/i })).toBeInTheDocument()
  })

  it('shows collapse button when expanded', () => {
    render(<SidebarPanel title="参数">body</SidebarPanel>)
    expect(screen.getByRole('button', { name: /折叠/i })).toBeInTheDocument()
  })

  it('toggles between collapsed and expanded', () => {
    render(<SidebarPanel>sidebar body</SidebarPanel>)
    const btn = screen.getByRole('button', { name: /折叠/i })
    fireEvent.click(btn)
    expect(screen.queryByText('sidebar body')).not.toBeInTheDocument()
    const expandBtn = screen.getByRole('button', { name: /展开/i })
    fireEvent.click(expandBtn)
    expect(screen.getByText('sidebar body')).toBeInTheDocument()
  })

  it('renders title when provided', () => {
    render(<SidebarPanel title="参数控制">body</SidebarPanel>)
    expect(screen.getByText('参数控制')).toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/ui/panels/__tests__/SidebarPanel.test.tsx`
Expected: FAIL — module not found.

**Step 3: Implement SidebarPanel**

Create `src/ui/panels/SidebarPanel.tsx`:

```tsx
import { useState, type ReactNode } from 'react'

type SidebarPanelProps = {
  title?: string
  defaultWidth?: number
  defaultCollapsed?: boolean
  children: ReactNode
}

export function SidebarPanel({
  title,
  defaultWidth = 320,
  defaultCollapsed = false,
  children,
}: SidebarPanelProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)

  if (collapsed) {
    return (
      <div className="absolute left-0 top-0 bottom-0 z-30 flex">
        <button
          className="flex items-center justify-center w-10 bg-white/90 backdrop-blur-sm border-r border-gray-200 text-gray-500 hover:text-gray-700"
          onClick={() => setCollapsed(false)}
          aria-label="展开参数面板"
        >
          →
        </button>
      </div>
    )
  }

  return (
    <div
      className="absolute left-0 top-0 bottom-0 z-30 flex flex-col bg-white/90 backdrop-blur-sm border-r border-gray-200 transition-all duration-200"
      style={{ width: `${defaultWidth}px` }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        {title && <span className="text-sm font-medium">{title}</span>}
        <button
          className="text-gray-500 hover:text-gray-700"
          onClick={() => setCollapsed(true)}
          aria-label="折叠参数面板"
        >
          ←
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {children}
      </div>
    </div>
  )
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/ui/panels/__tests__/SidebarPanel.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/ui/panels/SidebarPanel.tsx src/ui/panels/__tests__/SidebarPanel.test.tsx
git commit -m "feat(ui): add SidebarPanel component with collapse support"
```

---

### Task 10: Rewrite SceneLayout

**Files:**
- Modify: `src/ui/layout/SceneLayout.tsx`

**Step 1: Write the failing test**

Create `src/ui/layout/__tests__/SceneLayout.five-zone.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SceneLayout } from '../SceneLayout'

describe('SceneLayout five-zone', () => {
  it('renders viewport', () => {
    render(
      <SceneLayout
        controls={<div>params</div>}
        viewport={<div data-testid="canvas">3D canvas</div>}
      />,
    )
    expect(screen.getByTestId('canvas')).toBeInTheDocument()
  })

  it('renders controls in sidebar', () => {
    render(
      <SceneLayout
        controls={<div>参数控制</div>}
        viewport={<div>canvas</div>}
      />,
    )
    expect(screen.getByText('参数控制')).toBeInTheDocument()
  })

  it('renders dataOverlay when provided', () => {
    render(
      <SceneLayout
        controls={<div>params</div>}
        viewport={<div>canvas</div>}
        dataOverlay={<div>实时数据</div>}
      />,
    )
    expect(screen.getByText('实时数据')).toBeInTheDocument()
  })

  it('does not render data panel when not provided', () => {
    render(
      <SceneLayout
        controls={<div>params</div>}
        viewport={<div>canvas</div>}
      />,
    )
    expect(screen.queryByText('数据')).not.toBeInTheDocument()
  })

  it('renders chart when provided and visible', () => {
    render(
      <SceneLayout
        controls={<div>params</div>}
        viewport={<div>canvas</div>}
        chart={<div>V-t 波形</div>}
        chartVisible
      />,
    )
    expect(screen.getByText('V-t 波形')).toBeInTheDocument()
  })

  it('does not render chart when chartVisible is false', () => {
    render(
      <SceneLayout
        controls={<div>params</div>}
        viewport={<div>canvas</div>}
        chart={<div>V-t 波形</div>}
        chartVisible={false}
      />,
    )
    expect(screen.queryByText('V-t 波形')).not.toBeInTheDocument()
  })

  it('renders playback when provided', () => {
    render(
      <SceneLayout
        controls={<div>params</div>}
        viewport={<div>canvas</div>}
        playback={<div>播放控件</div>}
      />,
    )
    expect(screen.getByText('播放控件')).toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/ui/layout/__tests__/SceneLayout.five-zone.test.tsx`
Expected: FAIL — current SceneLayout doesn't accept new props.

**Step 3: Rewrite SceneLayout.tsx**

Replace `src/ui/layout/SceneLayout.tsx` entirely:

```tsx
import { useState, type ReactNode } from 'react'

type SceneLayoutProps = {
  viewport: ReactNode
  controls: ReactNode
  dataOverlay?: ReactNode
  chart?: ReactNode
  playback?: ReactNode
  chartVisible?: boolean
}

export function SceneLayout({
  viewport,
  controls,
  dataOverlay,
  chart,
  playback,
  chartVisible = false,
}: SceneLayoutProps) {
  const [showChart, setShowChart] = useState(chartVisible)

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Animation zone: full-screen base layer */}
      <div className="absolute inset-0 z-0">
        {viewport}
      </div>

      {/* Parameter sidebar */}
      <SidebarPanel title="参数控制">
        {controls}
      </SidebarPanel>

      {/* Data floating panel */}
      {dataOverlay && (
        <FloatingPanel
          title="数据"
          defaultPosition={{ x: 0, y: 0 }}
        >
          <div className="p-3 min-w-[200px]">
            {dataOverlay}
          </div>
        </FloatingPanel>
      )}

      {/* Chart floating panel */}
      {chart && showChart && (
        <FloatingPanel
          title="图表"
          defaultPosition={{ x: 0, y: 300 }}
          closable
          onClose={() => setShowChart(false)}
        >
          <div className="p-3 min-w-[300px]">
            {chart}
          </div>
        </FloatingPanel>
      )}

      {/* Playback floating panel */}
      {playback && (
        <FloatingPanel
          title="播放控制"
          defaultPosition={{ x: 0, y: 0 }}
          zIndex="z-20"
        >
          <div className="p-3 flex items-center gap-2">
            {playback}
          </div>
        </FloatingPanel>
      )}
    </div>
  )
}
```

Note: The actual file will import `FloatingPanel` from `../panels/FloatingPanel` and `SidebarPanel` from `../panels/SidebarPanel`. The default positions above are placeholders — they need viewport-relative calculation in the real implementation.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/ui/layout/__tests__/SceneLayout.five-zone.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/ui/layout/SceneLayout.tsx src/ui/layout/__tests__/SceneLayout.five-zone.test.tsx
git commit -m "feat(layout): rewrite SceneLayout as five-zone layout"
```

---

## Phase 4: Migrate Pilot Scenes

### Task 11: Migrate alternator scene

**Files:**
- Modify: `src/scenes/alternator/AlternatorScene.tsx`
- Modify: `src/scenes/alternator/AlternatorControls.tsx`

**Step 1: Split AlternatorControls into separate concerns**

The current `AlternatorControls` (line 36-121) bundles RangeFields, SceneActions, chart, and telemetry into one component. Split it:

1. **Controls (parameters):** Lines 41-76 (RangeFields only)
2. **Playback:** Lines 78-91 (SceneActions: play/pause/reset)
3. **Chart:** Lines 93-103 (AlternatorChart wrapper)
4. **Data overlay:** Lines 105-118 (telemetry metrics)

In `AlternatorControls.tsx`, remove the chart card (lines 93-103) and telemetry div (lines 105-118). Keep only RangeFields.

**Step 2: Update AlternatorScene.tsx to use new props**

Replace the `<SceneLayout>` call to use the five-zone props:

```tsx
export function AlternatorScene() {
  const theme = useAppStore((state) => state.theme)
  const state = useAlternatorSceneState()
  // ... existing viewport computations ...

  return (
    <SceneLayout
      viewport={
        <InteractiveCanvas
          camera={{ position: [14, 10, 18], fov: 45 }}
          controls={{ target: [0, 0, 0], minDistance: 10, maxDistance: 38 }}
          frameloop={state.running ? 'always' : 'demand'}
        >
          <AlternatorRig3D
            angleRad={state.angleRad}
            meterNeedleAngleRad={viewportNeedleAngleRad}
            theme={theme}
          />
        </InteractiveCanvas>
      }
      controls={<AlternatorControls state={state} />}
      playback={
        <SceneActions
          actions={[
            { key: 'toggle-running', label: state.running ? '暂停' : '播放', onClick: state.toggleRunning },
            { key: 'reset', label: '重置', onClick: state.reset },
          ]}
        />
      }
      chart={
        <AlternatorChart
          voltageHistory={state.history.voltage}
          currentVoltageV={state.instantaneousVoltageV}
          currentTimeLabel={state.timeLabel}
          peakVoltageV={state.peakVoltageV}
        />
      }
      chartVisible
      dataOverlay={
        <div className="text-sm space-y-1">
          <p>转速 ω: <strong>{state.speedLabel}</strong></p>
          <p>匝数 N: <strong>{state.turnsLabel}</strong></p>
          <p>面积 S: <strong>{state.areaLabel}</strong></p>
          <p>磁通 Φ: <strong>{state.fluxLabel}</strong></p>
          <p>电压 e: <strong>{state.voltageLabel}</strong></p>
          <p>电流 I: <strong>{state.currentLabel}</strong></p>
          <p>频率 f: <strong>{state.frequencyLabel}</strong></p>
          <p>方向: <strong>{state.currentDirectionLabel}</strong></p>
          <p>偏角: <strong>{state.needleAngleLabel}</strong></p>
        </div>
      }
    />
  )
}
```

Remove the viewport overlay divs (title, EMF panel, legend, speed slider) from the viewport — these are either moved to data overlay or removed.

**Step 3: Verify scene renders**

Run: `npm run dev` and navigate to `/alternator`
Expected: Five-zone layout with 3D canvas full-screen, sidebar with sliders, floating data panel, floating chart, floating playback controls.

**Step 4: Commit**

```bash
git add src/scenes/alternator/AlternatorScene.tsx src/scenes/alternator/AlternatorControls.tsx
git commit -m "feat(alternator): migrate to five-zone layout"
```

---

### Task 12: Migrate MHD scene

**Files:**
- Modify: `src/scenes/mhd/MhdGeneratorScene.tsx`
- Modify: `src/scenes/mhd/MhdControls.tsx`

**Step 1: Update MhdGeneratorScene.tsx**

MHD is simpler — no chart, no viewport overlays. Update the `<SceneLayout>` call:

```tsx
export function MhdGeneratorScene() {
  const state = useMhdSceneState()

  return (
    <SceneLayout
      viewport={
        <InteractiveCanvas
          camera={{ position: [0, 1.8, 6.8], fov: 39 }}
          frameloop={state.running ? 'always' : 'demand'}
        >
          <MhdGeneratorRig3D
            phase={state.phase}
            running={state.running}
            chargeSeparation={state.chargeSeparation}
            driveRatio={state.driveRatio}
            plasmaDensityRatio={state.plasmaDensityRatio}
          />
        </InteractiveCanvas>
      }
      controls={<MhdControls ... />}  // keep existing props
      playback={
        <SceneActions
          actions={[
            { key: 'toggle', label: state.running ? '暂停' : '播放', onClick: state.toggleRunning },
            { key: 'reset', label: '重置', onClick: state.reset },
          ]}
        />
      }
      dataOverlay={
        <div className="text-sm space-y-1">
          <p>状态: {state.running ? '运行中' : '已暂停'}</p>
          <p>输出电压: <strong>{state.voltageDisplayV.toFixed(1)} V</strong></p>
          <p>B: {state.magneticFieldT.toFixed(1)} T · v: {state.plasmaVelocityMps.toFixed(0)} m/s</p>
        </div>
      }
    />
  )
}
```

**Step 2: Verify scene renders**

Run: `npm run dev` and navigate to `/mhd`
Expected: Three-zone layout (no chart panel), data overlay and playback floating.

**Step 3: Commit**

```bash
git add src/scenes/mhd/MhdGeneratorScene.tsx src/scenes/mhd/MhdControls.tsx
git commit -m "feat(mhd): migrate to five-zone layout"
```

---

## Phase 5: Migrate Remaining Scenes

### Task 13: Migrate Batch 2 scenes (6 scenes)

**Files:**
- Modify: `src/scenes/oscilloscope/OscilloscopeScene.tsx`
- Modify: `src/scenes/cyclotron/CyclotronScene.tsx`
- Modify: `src/scenes/electromagnetic-drive/ElectromagneticDriveScene.tsx`
- Modify: `src/scenes/induction-current/InductionCurrentScene.tsx`
- Modify: `src/scenes/motional-emf/MotionalEmfScene.tsx`
- Modify: `src/scenes/rotational-emf/RotationalEmfScene.tsx`
- Corresponding Controls files as needed

Follow the same pattern as Task 11-12 for each scene:
1. Split controls content into `controls` (RangeFields/SelectFields), `dataOverlay` (metrics/readouts), `chart` (chart components), `playback` (SceneActions)
2. Remove `presentationSignals` and `coreSummary` props
3. Remove viewport overlay divs (move data to dataOverlay)
4. Remove `data-presentation-signal` attributes

Commit after all 6 are done:

```bash
git add src/scenes/oscilloscope src/scenes/cyclotron src/scenes/electromagnetic-drive src/scenes/induction-current src/scenes/motional-emf src/scenes/rotational-emf
git commit -m "feat(scenes): migrate batch 2 scenes to five-zone layout"
```

---

### Task 14: Migrate Batch 3 scenes (4 scenes)

**Files:**
- Modify: `src/scenes/oersted/OerstedScene.tsx`
- Modify: `src/scenes/equipotential/EquipotentialScene.tsx`
- Modify: `src/scenes/potential-energy/PotentialEnergyScene.tsx`
- Modify: `src/scenes/electrostatic-lab/ElectrostaticLabScene.tsx`
- Corresponding Controls files as needed

Same pattern as Task 13. These scenes are mostly interactive (no chart), so migration is simpler.

Commit after all 4 are done:

```bash
git add src/scenes/oersted src/scenes/equipotential src/scenes/potential-energy src/scenes/electrostatic-lab
git commit -m "feat(scenes): migrate batch 3 scenes to five-zone layout"
```

---

## Phase 6: Cleanup and Validation

### Task 15: Delete presentation regression tests and scripts

**Files:**
- Delete: `scripts/playwright/1080p-presentation-regression.mjs`
- Delete: `scripts/playwright/presentationRegressionCases.mjs` (if exists as separate file)
- Update: `package.json` scripts (remove `test:1080p-presentation` from `test:e2e`)

**Step 1: Delete files**

```bash
rm scripts/playwright/1080p-presentation-regression.mjs
```

**Step 2: Update package.json test:e2e script**

Remove `npm run test:1080p-presentation` from the `test:e2e` script chain.

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove presentation regression tests and scripts"
```

---

### Task 16: Run full verification

**Step 1: Run linter**

Run: `npm run lint`
Expected: No errors. Fix any import issues from deleted modules.

**Step 2: Run unit tests**

Run: `npm run test`
Expected: All tests pass. Fix any failures from missing presentation props/types.

**Step 3: Run build**

Run: `npm run build`
Expected: Build succeeds.

**Step 4: Run bundle budget**

Run: `npm run check:bundle-budget`
Expected: Pass (Tailwind CSS may add some size — adjust budgets if needed).

**Step 5: Run E2E tests**

Run: `npm run test:e2e`
Expected: Desktop roundtrip passes for all 12 scenes.

**Step 6: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve remaining issues after five-zone layout migration"
```

---

### Task 17: Update scene shell length check

**Files:**
- May need to update: `scripts/ci/check-scene-shell-length.mjs` if threshold needs adjustment

**Step 1: Check current shell lengths**

Run: `node scripts/ci/check-scene-shell-length.mjs`
Expected: Pass. If scenes got shorter (from splitting out data/chart/playback), all good. If any got longer, review.

**Step 2: Commit if changed**

```bash
git add scripts/ci/check-scene-shell-length.mjs
git commit -m "chore(ci): update scene shell length check for five-zone layout"
```

---

## Summary of Changes

| Category | Files Changed | Files Deleted | Lines Added (est.) | Lines Removed (est.) |
|---|---|---|---|---|
| Tailwind setup | 3 | 0 | ~15 | ~0 |
| Store simplification | 1 | 0 | ~40 | ~120 |
| Presentation removal | 0 | 5+12+2 | ~0 | ~700 |
| Layout policy | 1 | 0 | ~15 | ~45 |
| App + shortcuts | 2 | 0 | ~60 | ~120 |
| Config | 1 | 0 | ~0 | ~180 |
| useDraggable hook | 1 | 0 | ~65 | ~0 |
| FloatingPanel | 1 | 0 | ~55 | ~0 |
| SidebarPanel | 1 | 0 | ~45 | ~0 |
| SceneLayout rewrite | 1 | 0 | ~70 | ~200 |
| Alternator migration | 2 | 0 | ~60 | ~50 |
| MHD migration | 2 | 0 | ~30 | ~20 |
| Batch 2 (6 scenes) | 12 | 0 | ~200 | ~180 |
| Batch 3 (4 scenes) | 8 | 0 | ~120 | ~120 |
| Tests | ~8 new | 12 deleted | ~300 | ~400 |
| **Total** | ~43 | ~19 | ~1,035 | ~2,135 |
