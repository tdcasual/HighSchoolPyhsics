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
2. `dataOverlay` is a `<DataRows rows={[{ label, value, answer?, when? }]} />` (`ui/panels/DataRows`) with 3-5 key readings shown at a time (results, not echoes of sidebar parameters). Mark conclusions `answer: true` so prediction mode masks them; use `when` for mode-dependent rows.
3. Model caveats, formulas and sign conventions go in `notes` (or `<ModelNote>` inside controls), which render in the sidebar's collapsed 教师备注; the sidebar body keeps controls, how-to hints and legends.
4. Play/step/reset belong in `playbackActions`, built with `clockActions(transport, { stepLabel, onReset, playLabel?, pauseLabel?, finished?, disabled?, extra? })` from `simulation/clockActions` — the transport is the clock or any `{ running, toggle, step }`. It gives the keys Space = `toggle-running`, `.`/→ = `step`, `,`/← = `step-back` (arrows held repeat). Only scenes without play/pause (instrument nudges, 通电/释放, 接近/远离) list actions by hand, each with a reason in the convention test's `HAND_PLAYBACK`.
5. Compose the camera centered on the apparatus, with one view for every screen size (no phone/tablet camera branches; a convention test checks). Render 3D through `scene3d/FittedCanvas`: give the viewing direction (`shot={{ from, to }}` or `{ azimuth, elevation }`) and limits; it measures the apparatus (`FitBounds`, settling over the first second) and fits it into the largest area the panels leave free, once on open and on `refitKey` (a view preset), never per panel change. Mark floors, grids and backdrops `userData={NO_FIT}`; pass `shot.bounds` for parts that sweep (a rotating rod) or for a close-up. Scenes that compute bounds themselves (instruments, celestial orbits) use `useFittedOrbitCamera` (`useBoundsFraming` + `fitOrbitView`), which also holds still while a part is dragged. Never pass a literal `camera` to `InteractiveCanvas`, and do not copy viewport or framing helpers into a scene.
6. Open in a state that can be taught immediately (no mandatory "step 1" click).
7. Mark conclusion readings `answer: true` in `DataRows` (or wrap other conclusions in `<Answer>`; prediction mode masks them); add one 「已知 …」 row with the givens when the class is expected to calculate. If the chart is what students read from (not the outcome), pass `chartMaskable={false}` and hide its answer marks with `usePredictionMasked()`.
8. Advance simulated time only through `src/simulation/`: `useSimulationClock` (play / pause / 单步 / slow motion / fixed sub-steps; the scene supplies `advance(dt)`, returning false when the process ends) with `clockActions` for the playback zone, or `useAnimatedState` / `useAnimationLoop` when a pure state machine owns its own `running` flag. Never hand-write a requestAnimationFrame time loop (a convention test enforces it). Pass `timeControl` when the clock honours the shell's slow motion; import `Line` from `scene3d/ClassroomLine`.
9. Use textbook notation on screen (`U<sub>AB</sub>`, not `U_AB`; no "a.u."); label reduced model scales 示意 and convert to textbook magnitude in notes.
10. Remember teacher-set parameters with `recall` + `useRemember` (or `rememberFields` / `useRememberFields`) from `app/sceneMemory`; offer 单步 in a meaningful unit (15°, T/4, 0.1 s) as a `step` playback action. `scenes/__tests__/sceneConventions.test.ts` enforces both: any scene with a `play`/`toggle-running` action needs `step` (or a reasoned entry in `NO_STEP`), and any scene with sliders/segmented controls/text fields must remember them. A slider that is run state rather than set-up (a phase, a replay time, a measuring wheel) takes `transient`. `scenes/__tests__/sceneContract.test.tsx` renders every scene and checks the classroom contract: 1–5 data rows in every sidebar mode, 单步 leaves time paused, reset works, prediction mode masks the scene's answers, and every non-transient slider survives reopening the scene.
11. Register the scene in two places: its entry in `config/demo-scenes.json` (a `touchProfile` only if it differs from the classroom default) and one row (chapter, topic, lesson type) in `ui/navigation/sceneNavigation.ts`, placed in textbook teaching order; then run `npm run thumbnails -- <pageId>` and `npm run test:visual-smoke:update` (baseline), and check `npm run test:interaction -- <pageId>` (set `CHROME_PATH` for a system Chrome). Keep the homepage free of three.js imports (`check:homepage-preload`).
12. Keep the layered structure: `useXxxSceneState` + `XxxControls` + `XxxRig3D` + `XxxScene` (a convention test requires the state hook, controls and scene files). Scenes never import from another scene: physics, drawing or 3D parts used by two scenes move to `src/domains/<subject>/` (optics, electrostatics) or `src/instruments/` (a convention test checks).
13. Use `FloatingPanel` for data/chart/playback zones — do not create custom overlay systems.
14. Use `SidebarPanel` for parameter controls — do not use custom side panels.
15. Draw charts with `ui/charts` (a convention test checks every `*Chart.tsx`): `ChartCard` (title, live status, legend, footer) around `ChartFrame` (axes, nice ticks, grid, clipping) with `Series` / `Dot` / `Segment` / `Cursor` / `Label` marks. Colour series with `var(--chart-1 … 6)` and `var(--chart-point)` so day/night follow the theme; mark conclusion curves or points `answer`. Diagrams (orbit plane, meter face) put their own SVG inside `ChartCard`; optics canvases use `useContainerWidth`, `useAdaptiveResolution`, `useSettledQuality` and `canvasMarks` (reticle, scale bar).

## 1080P Readability Baseline

1. In classroom mode, the data floating panel shows key readings without requiring sidebar interaction.
2. If the sidebar is collapsed, teachers can still access core data from the data overlay.
3. Chart floating panel can be opened on demand for waveform/trend analysis. Below 1680 px width the chart starts collapsed and large text zooms less, so a 1366×768 projector keeps room for the 3D view.

## Scene Structure Template

```tsx
import { FittedCanvas } from '../../scene3d/FittedCanvas'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { clockActions } from '../../simulation/clockActions'
import { DataRows } from '../../ui/panels/DataRows'
import { NewDemoControls } from './NewDemoControls'
import { NewDemoRig3D } from './NewDemoRig3D'
import { useNewDemoSceneState } from './useNewDemoSceneState'

export function NewDemoScene() {
  // The state hook owns `useSimulationClock({ advance, stepSeconds })` and returns it as `clock`.
  const state = useNewDemoSceneState()
  const { clock } = state

  return (
    <SceneLayout
      controls={<NewDemoControls state={state} />}
      dataOverlay={
        <DataRows
          rows={[
            { label: '状态', value: clock.running ? '运行中' : '已暂停' },
            { label: '核心量', value: `${state.intensity.toFixed(1)} V`, answer: true },
          ]}
        />
      }
      notes={<p>模型假设与公式写在这里，默认折叠在侧栏末尾。</p>}
      chart={state.showChart ? <NewDemoChart data={state.chartData} /> : undefined}
      chartVisible={state.showChart}
      playbackActions={clockActions(clock, { stepLabel: '单步 T/4', onReset: state.reset })}
      viewport={
        <FittedCanvas shot={{ from: [4, 3, 6], to: [0, 0, 0] }} fov={42} frameloop={clock.frameloop}>
          <NewDemoRig3D intensity={state.intensity} />
        </FittedCanvas>
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
- `src/domains/optics/` — spectrum colours, colour filters, diffraction model, pattern-canvas machinery, optical bench parts and the 光源 control section, shared by the interference and diffraction scenes
- `src/scene3d/FittedCanvas.tsx` — the canvas every apparatus scene renders through (measured bounds fitted into the free area)
- `src/ui/charts/` — chart kit (ChartCard, ChartFrame and marks, scales, optics canvas hooks)
- `src/scene3d/orbitFraming.ts`, `src/scene3d/useBoundsFraming.ts` — bounds-based camera framing shared by apparatus scenes
- `src/instruments/measuring/` — caliper/micrometer models, scales, 3D assemblies, reading figures and practice flow, shared by the 游标卡尺, 螺旋测微器 and 电阻率 scenes
