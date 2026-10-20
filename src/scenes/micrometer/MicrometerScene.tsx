import { useRef } from 'react'
import { cameraLimits, instrumentView } from '../../instruments/measuring/pose'
import { shouldShowSpecimen, specimenSize } from '../../instruments/measuring/practice'
import { MicrometerFigure } from '../../instruments/measuring/ReadingFigures'
import { useInstrumentCamera } from '../../instruments/measuring/useInstrumentCamera'
import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { useAppStore } from '../../store/useAppStore'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { Answer } from '../../ui/notes/Answer'
import { MicrometerControls } from './MicrometerControls'
import { formatZero } from './state'
import { MicrometerRig3D } from './MicrometerRig3D'
import { useMicrometerSceneState } from './useMicrometerSceneState'

export function MicrometerScene() {
  const night = useAppStore((store) => store.theme) === 'night'
  const state = useMicrometerSceneState()
  const viewportRef = useRef<HTMLDivElement>(null)
  const showWork = shouldShowSpecimen(state)
  const workSize = specimenSize(state)
  const limits = cameraLimits('micrometer')
  const camera = useInstrumentCamera(viewportRef, state.view, limits, (area) => instrumentView({
    ...area,
    tool: 'micrometer',
    mode: 'outer',
    preset: state.view,
    caliperX: 0,
    reading: state.indicated,
    // Frame the end state of 拆开/合拢 once, so the camera holds still while the parts move.
    micrometerExplode: state.explodeTarget,
    showWork,
    workSize,
  }))
  const adjustable = state.lesson !== 'read' && !(state.challengeActive && state.lastCheckAt !== null) && !state.locked
  const practiceLocked = state.challengeActive && state.lesson === 'read'

  return (
    <SceneLayout
      chartContentClassName="measure-chart-content"
      controls={<MicrometerControls state={state} />}
      dataOverlay={
        <div className="measure-telemetry scene-core-summary-stack">
          <p><span>仪器</span><strong>螺旋测微器 · 0.01 mm</strong></p>
          <p><span>示数</span><strong>{state.reveal ? <Answer>{state.readingText}</Answer> : '判定后显示'}</strong></p>
          <p><span>分解</span><strong>{state.reveal ? <Answer>{state.breakdownText}</Answer> : '先观察刻度'}</strong></p>
          <p><span>锁紧</span><strong>{practiceLocked ? '已固定（读数题）' : state.locked ? '螺杆已锁紧' : '可以转动微分筒'}</strong></p>
          <p><span>零点</span><strong>{formatZero(state.zero)}</strong></p>
        </div>
      }
      notes={
        <>
          <p>读数 = 固定刻度（读到 0.5 mm，看半毫米刻线是否露出）+ 可动刻度对齐格数（估读一位）× 0.01 mm，结果读到 0.001 mm，末位的 0 不能省。</p>
          <p>螺距 0.5 mm：微分筒转一圈（50 格）测微螺杆前进或后退 0.5 mm，所以一格是 0.01 mm。</p>
          <p>零点误差：测砧与测微螺杆接触时的示数。示数 = 实际长度 + 零点误差，校正后长度 = 示数 − 零点误差。</p>
          <p>测量时先转微分筒使测微螺杆接近工件，再改用棘轮，听到“喀喀”声即停，然后拧紧锁紧装置再读数。</p>
        </>
      }
      chart={<MicrometerFigure reading={state.indicated} zero={state.zero} reveal={state.reveal} click={state.click} />}
      chartVisible
      chartMaskable={false}
      playbackActions={[
        { key: 'step-back', label: '−0.01 mm', onClick: () => state.nudge(-1), disabled: !adjustable },
        { key: 'step', label: '+0.01 mm', onClick: () => state.nudge(1), disabled: !adjustable },
        { key: 'explode', label: state.explodeTarget > 0.5 ? '合拢' : '拆开', onClick: state.toggleExplode, disabled: practiceLocked },
        { key: 'lock', label: state.locked ? '松开' : '锁紧', onClick: state.toggleLock, disabled: practiceLocked },
        { key: 'reset', label: '重置', onClick: state.reset },
      ]}
      viewport={
        <div ref={viewportRef} className="h-full w-full">
          <InteractiveCanvas {...camera.canvasProps} frameloop={state.animating ? 'always' : 'demand'}>
            <MicrometerRig3D
              night={night}
              micGap={state.position}
              micZero={state.zero}
              micExplode={state.explode}
              micLocked={state.locked}
              workSize={workSize}
              showWork={showWork}
              showLabels={state.showLabels}
              viewPreset={state.view}
              onMicGapChange={state.lesson === 'read' ? undefined : (value) => state.setGap(value, 'slider')}
              onInstrumentDragChange={camera.onInstrumentDragChange}
            />
          </InteractiveCanvas>
        </div>
      }
    />
  )
}

export default MicrometerScene
