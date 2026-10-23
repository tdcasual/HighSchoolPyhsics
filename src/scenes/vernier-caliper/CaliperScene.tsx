import { useRef } from 'react'
import { DataRows } from '../../ui/panels/DataRows'
import { VERNIER_SPANS } from '../../instruments/measuring/model'
import { cameraLimits, instrumentView } from '../../instruments/measuring/pose'
import { shouldShowSpecimen, specimenSize } from '../../instruments/measuring/practice'
import { CaliperFigure } from '../../instruments/measuring/ReadingFigures'
import { useFittedOrbitCamera } from '../../scene3d/useFittedOrbitCamera'
import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { useAppStore } from '../../store/useAppStore'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { Answer } from '../../ui/notes/Answer'
import { CaliperControls } from './CaliperControls'
import { CaliperRig3D } from './CaliperRig3D'
import { MEASURE_LABELS, digitsFor } from './state'
import { useCaliperSceneState } from './useCaliperSceneState'

export function CaliperScene() {
  const night = useAppStore((store) => store.theme) === 'night'
  const state = useCaliperSceneState()
  const viewportRef = useRef<HTMLDivElement>(null)
  const showWork = shouldShowSpecimen(state)
  const workSize = specimenSize(state)
  const limits = cameraLimits('caliper')
  const camera = useFittedOrbitCamera(viewportRef, `${state.measure}-${state.view}`, limits, (area) =>
    instrumentView({
      ...area,
      tool: 'caliper',
      mode: state.measure,
      preset: state.view,
      caliperX: state.position,
      vernierSpan: VERNIER_SPANS[state.divisions],
      reading: 0,
      // Frame the end state of 拆开/合拢 once, so the camera holds still while the parts move.
      caliperExplode: state.explodeTarget,
      showWork,
      workSize,
    }),
  )
  const fineStepText = state.precision.toFixed(digitsFor(state.divisions))
  const adjustable = state.lesson !== 'read' && !(state.challengeActive && state.lastCheckAt !== null) && !state.locked
  const practiceLocked = state.challengeActive && state.lesson === 'read'

  return (
    <SceneLayout
      chartVariant="figure"
      controls={<CaliperControls state={state} />}
      dataOverlay={
        <DataRows
          className="measure-telemetry"
          rows={[
            { label: '仪器', value: <>游标卡尺 · {state.divisions} 分度</> },
            { label: '示数', value: state.reveal ? <Answer>{state.readingText}</Answer> : '判定后显示' },
            { label: '分解', value: state.reveal ? <Answer>{state.breakdownText}</Answer> : '先观察刻度' },
            {
              label: '锁紧',
              value: practiceLocked ? '已固定（读数题）' : state.locked ? '螺钉已拧紧' : '可以移动尺框',
            },
            { label: '部位', value: MEASURE_LABELS[state.measure] },
          ]}
        />
      }
      notes={
        <>
          <p>
            读数 = 主尺整毫米数 + 对齐的游标格数 × 精度。精度 = 1 mm ÷ 分度数：10、20、50 分度分别为 0.1、0.05、0.02
            mm。
          </p>
          <p>
            游标卡尺不估读：读到精度那一位为止，末位的 0 不能省（如 20 分度读作 23.50
            mm）。主尺读游标零线左侧的整毫米数，不是游标左端。
          </p>
          <p>外测量爪测外径与厚度，内测量爪测内径与槽宽，深度尺测孔与槽的深度；三者共用同一套刻度。</p>
        </>
      }
      chart={<CaliperFigure x={state.position} divisions={state.divisions} reveal={state.reveal} />}
      chartVisible
      chartMaskable={false}
      playbackActions={[
        { key: 'step-back', label: `−${fineStepText} mm`, onClick: () => state.nudge(-1), disabled: !adjustable },
        { key: 'step', label: `+${fineStepText} mm`, onClick: () => state.nudge(1), disabled: !adjustable },
        {
          key: 'explode',
          label: state.explodeTarget > 0.5 ? '合拢' : '拆开',
          onClick: state.toggleExplode,
          disabled: practiceLocked,
        },
        { key: 'lock', label: state.locked ? '松开' : '锁紧', onClick: state.toggleLock, disabled: practiceLocked },
        { key: 'reset', label: '重置', onClick: state.reset },
      ]}
      viewport={
        <div ref={viewportRef} className="h-full w-full">
          <InteractiveCanvas
            key={state.measure}
            {...camera.canvasProps}
            frameloop={state.animating ? 'always' : 'demand'}
          >
            <CaliperRig3D
              night={night}
              divisions={state.divisions}
              measure={state.measure}
              caliperX={state.position}
              caliperExplode={state.explode}
              caliperLocked={state.locked}
              workSize={workSize}
              showWork={showWork}
              showLabels={state.showLabels}
              viewPreset={state.view}
              onCaliperXChange={state.lesson === 'read' ? undefined : state.setPosition}
              onInstrumentDragChange={camera.onInstrumentDragChange}
            />
          </InteractiveCanvas>
        </div>
      }
    />
  )
}

export default CaliperScene
