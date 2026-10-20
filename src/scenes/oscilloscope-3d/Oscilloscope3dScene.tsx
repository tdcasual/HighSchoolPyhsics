import { useMemo } from 'react'
import { DataRows } from '../../ui/panels/DataRows'
import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { useAppStore } from '../../store/useAppStore'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { MOBILE_BREAKPOINT, useMediaQuery } from '../../ui/hooks/useMediaQuery'
import { Oscilloscope3dChart } from './Oscilloscope3dChart'
import { Oscilloscope3dControls } from './Oscilloscope3dControls'
import { buildNormalTrace, buildXYTrace, deriveBeamProgress } from './model'
import { Oscilloscope3dRig3D } from './Oscilloscope3dRig3D'
import { useOscilloscope3dSceneState } from './useOscilloscope3dSceneState'
import './oscilloscope-3d.css'

const MODE_LABELS: Record<string, string> = {
  structure: '结构认知',
  scan: '扫描原理',
  measure: '波形测量',
  xy: 'X-Y 合成',
}
const PART_LABELS: Record<string, string> = {
  envelope: '透明示波管',
  'electron-gun': '电子枪',
  'y-plates': 'Y 偏转板',
  'x-plates': 'X 偏转板',
  screen: '荧光屏',
  beam: '电子束',
}

export function Oscilloscope3dScene() {
  const theme = useAppStore((state) => state.theme)
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT)
  const state = useOscilloscope3dSceneState()
  const cameraPosition: [number, number, number] = isMobile ? [11.8, 7.2, 15.2] : [14.1, 8.8, 18.4]
  const cameraTarget: [number, number, number] = [0.2, 0, 0]
  const effectiveTrigger = state.mode === 'scan' ? state.trigger : true
  const trace = useMemo(
    () => state.mode === 'xy'
      ? buildXYTrace({ xy: state.xy, elapsed: state.elapsed })
      : buildNormalTrace({
          wave: state.wave,
          amplitudeV: state.amplitudeV,
          frequencyHz: state.frequencyHz,
          voltsDiv: state.voltsDiv,
          timeDiv: state.timeDiv,
          elapsed: state.elapsed,
          trigger: effectiveTrigger,
        }),
    [state.mode, state.xy, state.elapsed, state.wave, state.amplitudeV, state.frequencyHz, state.voltsDiv, state.timeDiv, effectiveTrigger],
  )
  const beamProgress = deriveBeamProgress(state.mode, state.elapsed, state.timeDiv)
  const beam = trace[Math.floor(beamProgress * (trace.length - 1))] ?? [0, 0]
  const selectedLabel = state.selectedPart ? PART_LABELS[state.selectedPart] ?? state.selectedPart : '未选择部件'

  const isMeasuring = state.mode !== 'xy' && state.mode !== 'structure'

  return (
    <SceneLayout
      controls={<Oscilloscope3dControls state={state} />}
      viewport={(
        <InteractiveCanvas
          camera={{ position: cameraPosition, fov: 40 }}
          controls={{ target: cameraTarget, minDistance: 8, maxDistance: 30, maxPolarAngle: Math.PI * 0.82 }}
          frameloop={state.running ? 'always' : 'demand'}
        >
          <Oscilloscope3dRig3D
            mode={state.mode}
            elapsed={state.elapsed}
            running={state.running}
            selectedPart={state.selectedPart}
            onSelectPart={state.setSelectedPart}
            theme={theme}
            wave={state.wave}
            amplitudeV={state.amplitudeV}
            frequencyHz={state.frequencyHz}
            voltsDiv={state.voltsDiv}
            timeDiv={state.timeDiv}
            trigger={effectiveTrigger}
            xy={state.xy}
            trace={trace}
          />
        </InteractiveCanvas>
      )}
      dataOverlay={(
        <DataRows
          className="osc3d-telemetry"
          // Results only: the X/Y waveforms and amplitudes are already in the sidebar.
          rows={[
            { label: '工作模式', value: MODE_LABELS[state.mode] },
            { label: '选中部件', value: selectedLabel, when: state.mode === 'structure' },
            { label: '信号路径', value: '电子枪 → Y 偏转板 → X 偏转板 → 荧光屏', className: 'osc3d-conclusion', when: state.mode === 'structure' },
            { label: '频率比 X:Y', value: <>{state.xy.xRate}:{state.xy.yRate}</>, when: state.mode === 'xy' },
            { label: '相位差', value: <>{state.xy.phaseDeg}°</>, when: state.mode === 'xy' },
            { label: '轨迹关系', value: state.xyConclusion, answer: true, className: 'osc3d-conclusion', when: state.mode === 'xy' },
            { label: 'Uₚₚ', value: <>{state.measurement.peakToPeakV.toFixed(1)} V</>, answer: true, when: isMeasuring },
            { label: '周期 T', value: <>{state.measurement.periodMs.toFixed(2)} ms</>, answer: true, when: isMeasuring },
            { label: '屏幕刻度', value: <>{state.measurement.verticalDivisions.toFixed(1)} × {state.measurement.horizontalDivisions.toFixed(1)}</>, when: isMeasuring },
            { label: '触发', value: state.trigger ? '同步锁定' : '自由漂移', when: state.mode === 'scan' },
          ]}
          note={isMeasuring ? state.measurement.warnings.map((warning) => <p className="osc3d-warning" key={warning}>{warning}</p>) : null}
        />
      )}
      chart={<Oscilloscope3dChart trace={trace} beam={beam} running={state.running} mode={state.mode === 'xy' ? 'X-Y 轨迹' : 'Y(t)'} />}
      chartVisible
      chartInitiallyCollapsed
      playbackActions={[
        { key: 'toggle-running', label: state.running ? '暂停扫描' : '继续扫描', onClick: state.toggleRunning },
        { key: 'step', label: '单步 1 格', onClick: state.step },
        { key: 'reset', label: '重置', onClick: state.reset },
      ]}
    />
  )
}

export default Oscilloscope3dScene
