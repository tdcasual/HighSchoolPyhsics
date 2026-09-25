import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { MeasuringToolsChart } from './MeasuringToolsChart'
import { MeasuringToolsControls } from './MeasuringToolsControls'
import { MeasuringToolsRig3D } from './MeasuringToolsRig3D'
import { cameraLimits, instrumentView, orbitPosition } from './pose'
import { useMeasuringToolsSceneState } from './useMeasuringToolsSceneState'
import './measuring-tools.css'

export function MeasuringToolsScene() {
  const state = useMeasuringToolsSceneState()
  const limits = cameraLimits(state.tool)
  const view = instrumentView({
    tool: state.tool,
    mode: state.measure,
    preset: state.view,
    caliperX: state.caliperX,
    reading: state.micGap + state.micZero,
  })
  const position = orbitPosition(view)
  const showWork = state.lesson === 'read'

  return (
    <SceneLayout
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
        { key: 'explode', label: state.explodeLabel, onClick: state.toggleExplode },
        { key: 'lock', label: state.lockLabel, onClick: state.toggleLock },
        { key: 'reset', label: '重置', onClick: state.reset },
      ]}
      viewport={
        <InteractiveCanvas
          key={`${state.tool}-${state.measure}-${state.view}`}
          camera={{ position, fov: limits.fov, near: limits.near, far: limits.far }}
          adaptiveFraming={false}
          controls={{
            target: view.target,
            minDistance: limits.minDistance,
            maxDistance: limits.maxDistance,
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
            showWork={showWork}
            showLabels={state.showLabels}
          />
        </InteractiveCanvas>
      }
    />
  )
}

export default MeasuringToolsScene
