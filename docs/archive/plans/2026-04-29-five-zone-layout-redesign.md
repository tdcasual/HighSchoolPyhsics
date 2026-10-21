# Five-Zone Layout Redesign

Date: 2026-04-29

## Background

The current layout system uses a two-panel split (controls left, 3D viewport right) with a sophisticated presentation-mode auto-layout engine (`presentationDirector`, signal scoring, smart presentation contracts). This engine adds significant complexity (~700 lines) and the two-panel model limits flexibility for classroom teachers who need simultaneous access to data, charts, and playback controls.

## Decision

Completely remove the presentation mode auto-layout system. Replace the two-panel split with a five-zone layout where the 3D animation fills the full screen and all other zones are collapsible overlays.

## Zone Architecture

```
┌──────────────────────────────────────────────────┐
│  ┌─────────┐                        ┌──────────┐ │
│  │ 参数控制 │                        │ 数据区   │ │
│  │ 区(侧栏) │    动 画 区 (3D)        │ (悬浮)   │ │
│  │         │     全屏底层             └──────────┘ │
│  │ 折叠 ←→ │                                    │ │
│  │         │         ┌──────────────┐            │ │
│  │         │         │  图表区(悬浮) │            │ │
│  │         │         │  可关闭       │            │ │
│  │         │         └──────────────┘            │ │
│  └─────────┘                                    │ │
│              ┌──────────────────────┐            │ │
│              │ 播放控制区(悬浮)      │            │ │
│              │ ▶ ⏸ ⏪ 速度控制       │            │ │
│              └──────────────────────┘            │ │
└──────────────────────────────────────────────────┘
```

### Zone Properties

| Zone | Default State | Position | Collapse Behavior | Closable |
|---|---|---|---|---|
| Animation | Always visible | Full-screen base layer (z-0) | — | No |
| Parameters | Expanded | Left sidebar, 320px (z-30) | Collapses to narrow bar with expand button | No |
| Data | Expanded | Floating top-right (z-10) | Collapses to title bar only | No |
| Chart | Closed (open on demand) | Floating bottom-right area (z-10) | Collapses to title bar only | Yes (reopen via toolbar) |
| Playback | Expanded | Floating bottom-center (z-20) | Collapses to a single ▶/⏸ button (32x32) | No |

## Technology

- **CSS framework:** Tailwind CSS (new dependency)
- **Draggable panels:** Self-written `useDraggable` hook (~50 lines), pointer events driven
- **Collapse/expand:** Tailwind `grid-rows-[0fr]`/`grid-rows-[1fr]` with `transition-all`
- **Mobile adaptation:** Tailwind responsive prefixes, `usePanelBounds` hook for snap-to-corner + scale-down

## Component Architecture

```
<SceneLayout>
  ├── <InteractiveCanvas>              // z-0, full-screen
  │     └── <Rig3D />
  ├── <SidebarPanel>                   // z-30, left
  │     ├── <SidebarPanel.Header>
  │     └── <SidebarPanel.Body>  → {controls}
  ├── <FloatingPanel key="data">       // z-10, draggable
  │     ├── <FloatingPanel.Header>
  │     └── <FloatingPanel.Body>  → {dataOverlay}
  ├── <FloatingPanel key="chart">      // z-10, draggable, closable
  │     ├── <FloatingPanel.Header>
  │     └── <FloatingPanel.Body>  → {chart}
  └── <FloatingPanel key="playback">   // z-20, draggable
        ├── <FloatingPanel.Header>
        └── <FloatingPanel.Body>  → {playback}
```

### SceneLayout Props

```ts
type SceneLayoutProps = {
  viewport: ReactNode
  controls: ReactNode
  dataOverlay?: ReactNode
  chart?: ReactNode
  playback?: ReactNode
  chartVisible?: boolean
  panelPositions?: PanelPositions
}
```

### New Hooks

| Hook | Responsibility | Est. Lines |
|---|---|---|
| `useDraggable` | Pointer events drag, returns `{ style, handlers, position, setPosition }` | ~50 |
| `usePanelCollapse` | Collapse/expand state + Tailwind transition classes | ~20 |
| `usePanelBounds` | Viewport boundary clamping + mobile adaptive scaling | ~40 |

### FloatingPanel Props

```ts
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
```

### SidebarPanel Props

```ts
type SidebarPanelProps = {
  title?: string
  defaultWidth?: number    // default 320px
  children: ReactNode
}
```

## Mobile Adaptation

- `< 768px`: panel width capped at `min(280px, 85vw)`, max-height `40vh`
- On drag end, panels snap to nearest viewport corner
- Font size reduced to `text-xs`
- Touch target minimum 44px

## Removals

### Files to delete (~700 lines)

- `src/ui/layout/presentationDirector.ts` (97 lines)
- `src/ui/layout/usePresentationDirector.ts` (133 lines)
- `src/ui/layout/usePresentationStrategy.ts` (106 lines)
- `src/ui/layout/presentationSignals.ts` (70 lines)
- `src/ui/layout/useResizableSplitPanel.ts` (191 lines)
- All `__tests__/classroomMode.test.tsx` files (12 scenes)
- `scripts/playwright/1080p-presentation-regression.mjs`
- `scripts/playwright/presentationRegressionCases.mjs`

### Code to remove from existing files

- `src/store/useAppStore.ts`: `presentationMode`, `presentationRouteModes`, `NightTone` and their setters (~40 lines)
- `config/demo-scenes.json`: `classroom` field from all 12 entries
- `src/app/useGlobalShortcuts.ts`: `M` key (presentation toggle), `E` key (route mode toggle)
- `src/ui/layout/layoutPolicy.ts`: `isPresentationSplit`, `resolvePreferredLeftWidthPx`, `resolveLeftPanelBounds`

### Files to preserve unchanged

- All `model.ts` files (pure physics)
- All `*Rig3D.tsx` files (3D rendering)
- `src/scene3d/InteractiveCanvas.tsx`
- `src/ui/controls/RangeField.tsx`, `TextField.tsx`, `SelectField.tsx`, `SceneActions.tsx`
- `src/ui/layout/layoutPolicy.ts` (only `resolveLayoutTier` + breakpoints)

## Migration Strategy

### Batch 1: Infrastructure + 2 pilot scenes

1. Install and configure Tailwind CSS
2. Implement `FloatingPanel`, `SidebarPanel`, and hooks
3. Rewrite `SceneLayout`
4. Migrate `alternator` (most complex: chart + data + playback)
5. Migrate `mhd` (simplest: no chart, validates base structure)

### Batch 2: 6 scenes

6. oscilloscope, cyclotron, electromagnetic-drive, induction-current, motional-emf, rotational-emf

### Batch 3: 4 scenes

7. oersted, equipotential, potential-energy, electrostatic-lab

### Per-scene migration pattern

Extract content from the monolithic `controls` prop into the four new slots:

- `controls` → parameter sliders, selects, text inputs
- `dataOverlay` → real-time readings, probe values, direction indicators
- `chart` → waveform plots, trace charts, time-series graphs
- `playback` → play/pause/reset buttons, speed control

### Test changes

- Delete all `classroomMode.test.tsx` tests
- Delete `presentationRegressionCases` assertions
- Add `FloatingPanel.test.tsx`: collapse/expand, drag, boundary clamping, close
- Add `SidebarPanel.test.tsx`: collapse/expand, width
- Add `SceneLayout.test.tsx`: five-zone rendering, slot assignment, mobile adaptation
- Add `1080p-layout-regression` E2E test replacing old presentation regression
- All `model.test.ts` and `rig.test.tsx` files remain unchanged

## Playback Control Zone

- Default position: bottom center, `{ x: 50%, y: viewport_height - 80px }`
- Collapsed: single circular ▶/⏸ button (32x32px)
- Speed control: 0.25x / 0.5x / 1x / 2x selector
- Higher z-index (z-20) than other panels to avoid occlusion

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `1-9` | Navigate to scene |
| `D/N` | Toggle day/night theme |
| `P` | Toggle all panels collapse/expand (replaces old presentation toggle) |
| `Space` | Play/pause (when playback zone exists) |
