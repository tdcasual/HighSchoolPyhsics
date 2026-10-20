import { clockActions } from '../../simulation/clockActions'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { DataRows } from '../../ui/panels/DataRows'
import { OscilloscopeControls } from './OscilloscopeControls'
import { OscilloscopeCrt3D } from './OscilloscopeCrt3D'
import { OscilloscopeDisplay } from './OscilloscopeDisplay'
import { useOscilloscopeSceneState } from './useOscilloscopeSceneState'
import './oscilloscope.css'

export function OscilloscopeScene() {
  const state = useOscilloscopeSceneState()

  return (
    <SceneLayout
      controls={<OscilloscopeControls state={state} />}
      dataOverlay={
        <DataRows
          className="scope-telemetry"
          rows={[
            { label: '状态', value: state.clock.running ? '运行中' : '已暂停' },
            { label: '时刻', value: <>t = {state.timeCursor.toFixed(3)} s</> },
            { label: 'Ux / Uy', value: <>{state.ux.toFixed(2)} V / {state.uy.toFixed(2)} V</> },
            { label: '屏幕坐标（±1）', value: <>x={state.beamX >= 0 ? '+' : ''}{state.beamX.toFixed(2)}，y={state.beamY >= 0 ? '+' : ''}{state.beamY.toFixed(2)}</>, answer: true },
            {
              label: '满偏 ±10 V',
              value: state.clippingReasons.length ? `已限幅：${state.clippingReasons.join('、')}` : '未超量程',
              className: state.clippingReasons.length ? 'scope-overrange' : undefined,
            },
          ]}
        />
      }
      chart={
        <OscilloscopeDisplay
          beamX={state.beamX}
          beamY={state.beamY}
          traceSegments={state.traceSegments}
          running={state.clock.running}
        />
      }
      playbackActions={clockActions(state.clock, { stepLabel: '单步 0.05 s', onReset: state.reset })}
      chartVisible={true}
      chartInitiallyCollapsed
      viewport={
        <OscilloscopeCrt3D
          beamX={state.beamX}
          beamY={state.beamY}
          timeCursor={state.timeCursor}
          traceSegments={state.traceSegments}
          running={state.clock.running}
        />
      }
    />
  )
}

export default OscilloscopeScene
