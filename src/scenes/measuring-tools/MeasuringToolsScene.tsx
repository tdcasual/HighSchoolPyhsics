import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { useAppStore } from '../../store/useAppStore'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { MeasuringToolsChart } from './MeasuringToolsChart'
import { shouldShowSpecimen } from './state'
import { MeasuringToolsControls } from './MeasuringToolsControls'
import { MeasuringToolsRig3D } from './MeasuringToolsRig3D'
import { cameraLimits, instrumentView, orbitPosition, type OrbitView } from './pose'
import { useMeasuringToolsSceneState } from './useMeasuringToolsSceneState'
import './measuring-tools.css'

type ViewportSize = { left: number; width: number; height: number }

function useViewportSize(ref: RefObject<HTMLDivElement | null>): ViewportSize {
  const [size, setSize] = useState<ViewportSize>({ left: 0, width: 1280, height: 720 })

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const update = () => {
      const rect = element.getBoundingClientRect()
      const width = rect.width || window.innerWidth
      const height = rect.height || window.innerHeight
      const left = rect.left
      setSize((previous) =>
        Math.abs(previous.left - left) < 1 &&
        Math.abs(previous.width - width) < 1 &&
        Math.abs(previous.height - height) < 1
          ? previous
          : { left, width, height },
      )
    }

    update()
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null
    observer?.observe(element)
    window.addEventListener('resize', update)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [ref])

  return size
}

export function MeasuringToolsScene() {
  const state = useMeasuringToolsSceneState()
  const viewportRef = useRef<HTMLDivElement>(null)
  const viewportSize = useViewportSize(viewportRef)
  const [instrumentDragging, setInstrumentDragging] = useState(false)
  const [dragView, setDragView] = useState<OrbitView | null>(null)
  const currentView = useRef<OrbitView | null>(null)
  const sidebarCollapsed = useAppStore((store) => store.sidebarCollapsed)
  const mobileViewport = viewportSize.width <= 767
  const sidebarOffset = mobileViewport
    ? 0
    : Math.max(0, (sidebarCollapsed ? 44 : 320) + 20 - viewportSize.left)
  // The chart opens collapsed, so reserve the real data/playback overlay width instead
  // of the chart's expanded width. This leaves a useful canvas for the instrument.
  const chartPanelWidth = mobileViewport ? 0 : Math.min(320, viewportSize.width * 0.34)
  const safeLeft = mobileViewport ? 12 : sidebarOffset + chartPanelWidth + 24
  const safeRight = Math.max(safeLeft + 1, viewportSize.width - 20)
  const safeWidth = safeRight - safeLeft
  const safeAspect = safeWidth / Math.max(1, viewportSize.height)
  const centerOffsetPixels = (safeLeft + safeRight) / 2 - viewportSize.width / 2
  const limits = cameraLimits(state.tool)
  const showWork = shouldShowSpecimen(state)
  const fittedView = instrumentView({
    tool: state.tool,
    mode: state.measure,
    preset: state.view,
    caliperX: state.caliperX,
    reading: state.micGap + state.micZero,
    caliperExplode: state.caliperExplode,
    micrometerExplode: state.micExplode,
    showWork,
    workSize: state.workSize,
    aspect: safeAspect,
    centerOffsetPixels,
    viewportHeight: viewportSize.height,
  })
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
      chartInitiallyCollapsed
      controls={<MeasuringToolsControls state={state} />}
      dataOverlay={
        <div className="measure-telemetry scene-core-summary-stack">
          <p><span>仪器</span><strong>{state.tool === 'caliper' ? `游标卡尺 · ${state.divisions} 分度` : '螺旋测微器 · 0.01 mm'}</strong></p>
          <p><span>示数</span><strong>{state.reveal ? state.readingText : '判定后显示'}</strong></p>
          <p><span>分解</span><strong>{state.reveal ? state.breakdownText : '先观察刻度'}</strong></p>
          <p><span>锁紧</span><strong>{state.tool === 'caliper' ? (state.caliperLocked ? '螺钉已拧紧' : '可以移动尺框') : (state.micLocked ? '螺杆已锁紧' : '可以转动微分筒')}</strong></p>
          <p><span>部位</span><strong>{state.tool === 'caliper' ? (state.measure === 'outer' ? '外径' : state.measure === 'inner' ? '内径' : '深度') : `零点 ${state.micZero >= 0 ? '+' : ''}${state.micZero.toFixed(3)} mm`}</strong></p>
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
            key={`${state.tool}-${state.measure}-${state.view}`}
            camera={{ position, fov: limits.fov, near: limits.near, far: cameraFar }}
            adaptiveFraming={false}
            syncCamera
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
