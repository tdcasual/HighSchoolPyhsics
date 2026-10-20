# Agent Guidance (Classroom Mode — Five-Zone Layout)

This repository is for high-school classroom demos.
When designing or modifying animations/scenes, follow these rules by default.

## Architecture Overview

The layout uses a five-zone system where 3D animation fills the full screen and all other zones are collapsible overlays:

- **Animation zone** (z-0): Full-screen Three.js canvas via `InteractiveCanvas`
- **Parameters zone** (z-30): `SidebarPanel` on the left, collapsible to 44px
- **Data zone** (z-10): `FloatingPanel` with real-time readings
- **Chart zone** (z-10): `FloatingPanel` with waveforms, closable (restorable from the bottom dock)
- **Playback zone** (z-20): `FloatingPanel` with play/pause/reset controls, expanded by default

Data, chart and playback always stack in one column right of the sidebar. `InteractiveCanvas` samples that column once when the scene opens and maps the composition into the free area to its right (projection only); later panel changes just cover the view. Classroom large text (L), lecture mode (P) and Space for play/pause are shell features every scene gets.

Mobile (≤767px): viewport + fixed 30vh bottom panel with tabbed controls.

## Non-Negotiable Principles

1. 3D animation always fills the full viewport — other zones overlay, never split the viewport.
2. Core teaching data must remain visible even when the sidebar is collapsed (use `dataOverlay`).
3. Touch targets must be at least 44px (WCAG 2.5.5).
4. Preserve interaction consistency across all scenes.

## Required Implementation Rules

1. Every new scene must provide `controls`, `dataOverlay`, `chart` (if applicable), and `playbackActions` to `SceneLayout`.
2. `dataOverlay` should contain 3-5 lines of key readings (results, not echoes of sidebar parameters).
3. Model caveats, formulas and sign conventions go in `notes` (or `<ModelNote>` inside controls), which render in the sidebar's collapsed 教师备注; the sidebar body keeps controls, how-to hints and legends.
4. Play/step/reset belong in `playbackActions`; give the main play action the key `play` or `toggle-running` so Space triggers it.
5. Compose the camera centered on the apparatus. Do not shift it per desktop/mobile or per `sidebarCollapsed` to dodge panels; the shared safe area does that.
6. Open in a state that can be taught immediately (no mandatory "step 1" click).
7. Wrap conclusion readings in `<Answer>` (prediction mode masks them); add one 「已知 …」 row with the givens when the class is expected to calculate.
8. For fast processes pass `timeControl` and multiply the loop's frame delta by `getPlaybackRate()`; import `Line` from `scene3d/ClassroomLine`.
9. Use textbook notation on screen (`U<sub>AB</sub>`, not `U_AB`; no "a.u."); label reduced model scales 示意 and convert to textbook magnitude in notes.
10. Remember teacher-set parameters with `recall` + `useRemember` (or `rememberFields` / `useRememberFields`) from `app/sceneMemory`; offer 单步 in a meaningful unit (15°, T/4, 0.1 s) as a `step` playback action. Prefer `ui/charts/LineChart` and `scene3d/VectorArrow` for charts and vectors.
11. Register the scene in every overview view — its textbook chapter in `ui/navigation/regionData.ts`, its topic and lesson type in `ui/navigation/navigationViews.ts` — and run `npm run thumbnails -- <pageId>`. Keep the homepage free of three.js imports (`check:homepage-preload`).
12. Keep the layered structure: `useXxxSceneState` + `XxxControls` + `XxxRig3D` + `XxxScene`.
13. Use `FloatingPanel` for data/chart/playback zones — do not create custom overlay systems.
14. Use `SidebarPanel` for parameter controls — do not use custom side panels.

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
      notes={<p>模型假设与公式写在这里，默认折叠在侧栏末尾。</p>}
      chart={state.showChart ? <NewDemoChart data={state.chartData} /> : undefined}
      chartVisible={state.showChart}
      playbackActions={[
        { key: 'toggle-running', label: state.running ? '暂停' : '播放', onClick: state.toggleRunning },
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
