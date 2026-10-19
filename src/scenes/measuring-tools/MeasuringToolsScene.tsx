import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { useAppStore } from '../../store/useAppStore'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { MeasuringToolsChart } from './MeasuringToolsChart'
import { VERNIER_SPANS } from './model'
import { shouldShowSpecimen } from './state'
import { MeasuringToolsControls } from './MeasuringToolsControls'
import { MeasuringToolsRig3D } from './MeasuringToolsRig3D'
import { cameraLimits, instrumentView, orbitPosition, type OrbitView } from './pose'
import { useMeasuringToolsSceneState } from './useMeasuringToolsSceneState'
import { freeRects } from './framing'
import { useOverlayObstacles, useViewportSize } from './useViewportSize'
import './measuring-tools.css'

export function MeasuringToolsScene() {
  const theme = useAppStore((store) => store.theme)
  const state = useMeasuringToolsSceneState()
  const viewportRef = useRef<HTMLDivElement>(null)
  const viewportSize = useViewportSize(viewportRef)
  const [instrumentDragging, setInstrumentDragging] = useState(false)
  const [dragView, setDragView] = useState<OrbitView | null>(null)
  const currentView = useRef<OrbitView | null>(null)
  const obstacles = useOverlayObstacles(viewportRef, `${state.tool}-${state.measure}-${state.view}`)
  const limits = cameraLimits(state.tool)
  const showWork = shouldShowSpecimen(state)
  const viewInput = {
    tool: state.tool,
    mode: state.measure,
    preset: state.view,
    caliperX: state.caliperX,
    vernierSpan: VERNIER_SPANS[state.divisions],
    reading: state.micGap + state.micZero,
    caliperExplode: state.caliperExplode,
    micrometerExplode: state.micExplode,
    showWork,
    workSize: state.workSize,
    viewportHeight: viewportSize.height,
  }
  // Frame the instrument in whichever uncovered area shows it largest: beside the panel
  // column for the compact micrometer, usually below the panels for the long caliper.
  let fittedView: OrbitView | null = null
  for (const area of freeRects({
    width: viewportSize.width,
    height: viewportSize.height,
    obstacles,
    gutter: viewportSize.width <= 767 ? 12 : 20,
  })) {
    const candidate = instrumentView({
      ...viewInput,
      aspect: (area.right - area.left) / Math.max(1, viewportSize.height),
      heightFraction: (area.bottom - area.top) / Math.max(1, viewportSize.height),
      centerOffsetPixels: (area.left + area.right) / 2 - viewportSize.width / 2,
      centerOffsetYPixels: (area.top + area.bottom) / 2 - viewportSize.height / 2,
    })
    if (!fittedView || candidate.radius < fittedView.radius - 1e-6) fittedView = candidate
  }
  if (!fittedView) fittedView = instrumentView(viewInput)
  useLayoutEffect(() => {
    currentView.current = fittedView
  }, [fittedView])
  const view = dragView ?? fittedView
  const position = orbitPosition(view)
  const maxDistance = Math.max(limits.maxDistance, Math.ceil(view.radius * 1.2))
  const cameraFar = Math.max(limits.far, Math.ceil(maxDistance * 1.5))
  const onInstrumentDragChange = useCallback((dragging: boolean) => {
    setInstrumentDragging(dragging)
    setDragView(dragging ? currentView.current : null)
  }, [])

  return (
    <SceneLayout
      chartContentClassName="measure-chart-content"
      panelPlacement="after-sidebar"
      controls={<MeasuringToolsControls state={state} />}
      dataOverlay={
        <div className="measure-telemetry scene-core-summary-stack">
          <p><span>仪器</span><strong>{state.tool === 'caliper' ? `游标卡尺 · ${state.divisions} 分度` : '螺旋测微器 · 0.01 mm'}</strong></p>
          <p><span>示数</span><strong>{state.reveal ? state.readingText : '判定后显示'}</strong></p>
          <p><span>分解</span><strong>{state.reveal ? state.breakdownText : '先观察刻度'}</strong></p>
          <p><span>锁紧</span><strong>{state.tool === 'caliper' ? (state.caliperLocked ? '螺钉已拧紧' : '可以移动尺框') : (state.micLocked ? '螺杆已锁紧' : '可以转动微分筒')}</strong></p>
          {state.tool === 'caliper' ? (
            <p><span>部位</span><strong>{state.measure === 'outer' ? '外径' : state.measure === 'inner' ? '内径' : '深度'}</strong></p>
          ) : (
            <p><span>零点</span><strong>{`${state.micZero >= 0 ? '+' : ''}${state.micZero.toFixed(3)} mm`}</strong></p>
          )}
        </div>
      }
      chart={
        <MeasuringToolsChart
          tool={state.tool}
          reveal={state.reveal}
          divisions={state.divisions}
          caliperX={state.caliperX}
          micGap={state.micGap}
          micZero={state.micZero}
          click={state.micClick}
        />
      }
      chartVisible
      playbackActions={[
        { key: 'explode', label: state.explodeLabel, onClick: state.toggleExplode, disabled: state.challengeActive && state.lesson === 'read' },
        { key: 'lock', label: state.lockLabel, onClick: state.toggleLock, disabled: state.challengeActive && state.lesson === 'read' },
        { key: 'reset', label: '重置', onClick: state.reset },
      ]}
      viewport={
        <div ref={viewportRef} className="h-full w-full">
          <InteractiveCanvas
            key={`${state.tool}-${state.measure}`}
            camera={{ position, fov: limits.fov, near: limits.near, far: cameraFar }}
            adaptiveFraming={false}
            syncCamera
            screenOffset={view.screenOffset}
            controlsEnabled={!instrumentDragging}
            controls={{
              target: view.target,
              minDistance: limits.minDistance,
              maxDistance,
              minPolarAngle: limits.minPolarAngle,
              maxPolarAngle: limits.maxPolarAngle,
            }}
            frameloop={state.animating ? 'always' : 'demand'}
          >
            <MeasuringToolsRig3D
              night={theme === 'night'}
              tool={state.tool}
              divisions={state.divisions}
              measure={state.measure}
              caliperX={state.caliperX}
              caliperExplode={state.caliperExplode}
              caliperLocked={state.caliperLocked}
              micGap={state.micGap}
              micZero={state.micZero}
              micExplode={state.micExplode}
              micLocked={state.micLocked}
              objectSize={state.workSize}
              onCaliperXChange={state.lesson === 'read' ? undefined : state.setCaliperX}
              onMicGapChange={state.lesson === 'read' ? undefined : (value) => state.setMicGap(value, 'slider')}
              onInstrumentDragChange={onInstrumentDragChange}
              showWork={showWork}
              showLabels={state.showLabels}
              viewPreset={state.view}
            />
          </InteractiveCanvas>
        </div>
      }
    />
  )
}

export default MeasuringToolsScene
