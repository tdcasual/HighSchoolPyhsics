# Agent Guidance (Classroom Mode — Five-Zone Layout)

This repository is for high-school classroom demos.
When designing or modifying animations/scenes, follow these rules by default.

## Architecture Overview

The layout uses a five-zone system where 3D animation fills the full screen and all other zones are collapsible overlays:

- **Animation zone** (z-0): Full-screen Three.js canvas via `InteractiveCanvas`
- **Parameters zone** (z-30): `SidebarPanel` on the left, collapsible to 44px
- **Data zone** (z-10): `FloatingPanel` with real-time readings
- **Chart zone** (z-10): `FloatingPanel` with waveforms, closable
- **Playback zone** (z-20): `FloatingPanel` with play/pause/reset controls

Mobile (≤767px): viewport + fixed 30vh bottom panel with tabbed controls.

## Non-Negotiable Principles

1. 3D animation always fills the full viewport — other zones overlay, never split the viewport.
2. Core teaching data must remain visible even when the sidebar is collapsed (use `dataOverlay`).
3. Touch targets must be at least 44px (WCAG 2.5.5).
4. Preserve interaction consistency across all scenes.

## Required Implementation Rules

1. Every new scene must provide `controls`, `dataOverlay`, `chart` (if applicable), and `playbackActions` to `SceneLayout`.
2. `dataOverlay` should contain 3-5 lines of key readings visible in the floating data panel.
3. Keep the layered structure: `useXxxSceneState` + `XxxControls` + `XxxRig3D` + `XxxScene`.
4. Use `FloatingPanel` for data/chart/playback zones — do not create custom overlay systems.
5. Use `SidebarPanel` for parameter controls — do not use custom side panels.

## 1080P Readability Baseline

1. In classroom mode, the data floating panel shows key readings without requiring sidebar interaction.
2. If the sidebar is collapsed, teachers can still access core data from the data overlay.
3. Chart floating panel can be opened on demand for waveform/trend analysis.

## Scene Structure Template

```tsx
import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { NewDemoControls } from './NewDemoControls'
import { NewDemoRig3D } from './NewDemoRig3D'
import { useNewDemoSceneState } from './useNewDemoSceneState'

export function NewDemoScene() {
  const state = useNewDemoSceneState()

  return (
    <SceneLayout
      controls={<NewDemoControls state={state} />}
      dataOverlay={
        <div className="scene-core-summary-stack">
          <p>状态: {state.running ? '运行中' : '已暂停'}</p>
          <p>核心量: {state.intensity.toFixed(1)}</p>
        </div>
      }
      chart={state.showChart ? <NewDemoChart data={state.chartData} /> : undefined}
      chartVisible={state.showChart}
      playbackActions={[
        { key: 'play', label: state.running ? '暂停' : '播放', onClick: state.toggleRunning },
        { key: 'reset', label: '重置', onClick: state.reset },
      ]}
      viewport={
        <InteractiveCanvas frameloop={state.running ? 'always' : 'demand'}>
          <NewDemoRig3D running={state.running} intensity={state.intensity} />
        </InteractiveCanvas>
      }
    />
  )
}
```

## References

- `docs/classroom-presentation-principles.md` — layout principles and zone definitions
- `docs/plans/2026-04-29-five-zone-layout-redesign.md` — architecture decision record
- `src/ui/layout/SceneLayout.tsx` — layout implementation
- `src/ui/panels/FloatingPanel.tsx` — floating panel component
- `src/ui/panels/SidebarPanel.tsx` — sidebar panel component
