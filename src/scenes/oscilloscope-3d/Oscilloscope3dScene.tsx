import { useMemo } from 'react'
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
const WAVE_LABELS: Record<string, string> = {
  sine: '正弦波',
  square: '方波',
  triangle: '三角波',
  sawtooth: '锯齿波',
  dc: '直流',
  zero: '零输入',
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
        <div className="osc3d-telemetry scene-core-summary-stack">
          <p><span>工作模式</span><strong>{MODE_LABELS[state.mode]}</strong></p>
          <p><span>选中部件</span><strong>{selectedLabel}</strong></p>
          {state.mode === 'xy' ? (
            <>
              <p><span>X 通道</span><strong>{WAVE_LABELS[state.xy.xWave]}</strong></p>
              <p><span>Y 通道</span><strong>{WAVE_LABELS[state.xy.yWave]}</strong></p>
              <p><span>频率比 X:Y</span><strong>{state.xy.xRate}:{state.xy.yRate}</strong></p>
              <p><span>相位差</span><strong>{state.xy.phaseDeg}°</strong></p>
              <p><span>峰值偏转</span><strong>{state.xy.xAmplitude} × {state.xy.yAmplitude} div</strong></p>
              <p className="osc3d-conclusion"><span>轨迹关系</span><strong>{state.xyConclusion}</strong></p>
            </>
          ) : state.mode === 'structure' ? (
            <p className="osc3d-conclusion"><span>信号路径</span><strong>电子枪 → Y 偏转板 → X 偏转板 → 荧光屏</strong></p>
          ) : (
            <>
              <p><span>Uₚₚ</span><strong>{state.measurement.peakToPeakV.toFixed(1)} V</strong></p>
              <p><span>周期 T</span><strong>{state.measurement.periodMs.toFixed(2)} ms</strong></p>
              <p><span>屏幕刻度</span><strong>{state.measurement.verticalDivisions.toFixed(1)} × {state.measurement.horizontalDivisions.toFixed(1)}</strong></p>
              {state.mode === 'scan' && <p><span>触发</span><strong>{state.trigger ? '同步锁定' : '自由漂移'}</strong></p>}
              {state.measurement.warnings.map((warning) => <p className="osc3d-warning" key={warning}>{warning}</p>)}
            </>
          )}
        </div>
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
