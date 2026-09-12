import { ControlSection } from '../../ui/controls/ControlSection'
import { RangeField } from '../../ui/controls/RangeField'
import { SegmentedControl } from '../../ui/controls/SegmentedControl'
import { SelectField } from '../../ui/controls/SelectField'
import type { Oscilloscope3dSceneState } from './useOscilloscope3dSceneState'

type Props = { state: Oscilloscope3dSceneState }
const modeOptions = [{ key: 'structure', label: '结构认知' }, { key: 'scan', label: '扫描原理' }, { key: 'measure', label: '波形测量' }, { key: 'xy', label: 'X-Y 合成' }]
const waveformOptions = [{ value: 'sine', label: '正弦波' }, { value: 'square', label: '方波' }, { value: 'triangle', label: '三角波' }]
const xyWaveformOptions = [{ value: 'sine', label: '正弦' }, { value: 'square', label: '方波' }, { value: 'sawtooth', label: '锯齿' }, { value: 'triangle', label: '三角' }, { value: 'dc', label: '直流' }, { value: 'zero', label: '零' }]

export function Oscilloscope3dControls({ state }: Props) {
  return <div className="osc3d-controls grid gap-[0.8rem]">
    <div><h2>3D 示波器与波形测量</h2><p className="osc3d-subtitle">电子枪 → 偏转板 → 荧光屏 · 拖拽旋转、滚轮缩放</p></div>
    <SegmentedControl options={modeOptions} value={state.mode} onChange={(value) => state.setMode(value as typeof state.mode)} />
    {state.mode === 'structure' && <ControlSection title="结构认知"><p className="osc3d-help">点击 3D 模型部件查看名称。电子枪发射并聚焦电子束，两组正交偏转板控制光点的竖直与水平位置，荧光屏保留短暂余辉。</p><button className="osc3d-reset-view" type="button" onClick={() => state.setSelectedPart(null)}>整体视角</button></ControlSection>}
    {state.mode === 'scan' && <ControlSection title="扫描原理"><p className="osc3d-help">Y 偏转输入信号，X 偏转提供锯齿时基；触发同步可让波形稳定显示。</p><label className="osc3d-check"><input type="checkbox" checked={state.trigger} onChange={(event) => state.setTrigger(event.target.checked)} />触发稳定</label><RangeField id="osc3d-beam-speed" label="扫描速度" unit="×" min={0.25} max={2.5} step={0.05} value={state.beamSpeed} onChange={state.setBeamSpeed} displayValue={String(state.beamSpeed.toFixed(2)) + ' ×'} /></ControlSection>}
    {state.mode === 'measure' && <ControlSection title="波形测量"><SelectField id="osc3d-wave" label="信号波形" value={state.wave} onChange={(value) => state.setWave(value as typeof state.wave)} options={waveformOptions} /><RangeField id="osc3d-amplitude" label="峰值 Uₘ" unit="V" min={0.5} max={4} step={0.1} value={state.amplitudeV} onChange={state.setAmplitudeV} /><RangeField id="osc3d-frequency" label="频率 f" unit="Hz" min={20} max={500} step={10} value={state.frequencyHz} onChange={state.setFrequencyHz} /><RangeField id="osc3d-volts-div" label="VOLTS/DIV" unit="V" min={0.5} max={4} step={0.5} value={state.voltsDiv} onChange={state.setVoltsDiv} /><RangeField id="osc3d-time-div" label="TIME/DIV" unit="ms" min={0.5} max={5} step={0.5} value={state.timeDiv} onChange={state.setTimeDiv} /></ControlSection>}
    {state.mode === 'xy' && <><ControlSection title="轨迹预设"><SelectField id="osc3d-xy-preset" label="示例" value={state.xy.preset} onChange={(value) => state.applyXYPreset(value as typeof state.xy.preset)} options={[{ value: 'circle', label: '圆（正交同频）' }, { value: 'a', label: 'A · 锯齿-方波' }, { value: 'b', label: 'B · 方波-正弦' }, { value: 'c', label: 'C · 正弦-锯齿' }, { value: 'd', label: 'D · 方波-直流' }]} /></ControlSection><ControlSection title="X / Y 通道"><SelectField id="osc3d-x-wave" label="X 波形" value={state.xy.xWave} onChange={(value) => state.setXY({ xWave: value as typeof state.xy.xWave, preset: 'circle' })} options={xyWaveformOptions} /><SelectField id="osc3d-y-wave" label="Y 波形" value={state.xy.yWave} onChange={(value) => state.setXY({ yWave: value as typeof state.xy.yWave, preset: 'circle' })} options={xyWaveformOptions} /><RangeField id="osc3d-phase" label="相位差" unit="°" min={0} max={180} step={45} value={state.xy.phaseDeg} onChange={(value) => state.setXY({ phaseDeg: value, preset: 'circle' })} /><RangeField id="osc3d-xy-speed" label="扫描速度" unit="×" min={0.25} max={2.5} step={0.05} value={state.beamSpeed} onChange={state.setBeamSpeed} displayValue={String(state.beamSpeed.toFixed(2)) + ' ×'} /></ControlSection></>}
  </div>
}
