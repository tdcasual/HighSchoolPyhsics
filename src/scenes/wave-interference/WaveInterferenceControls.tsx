import { RangeField } from '../../ui/controls/RangeField'
import { ControlSection } from '../../ui/controls/ControlSection'
import { SceneActions } from '../../ui/controls/SceneActions'
import { SegmentedControl } from '../../ui/controls/SegmentedControl'
import type { WaveInterferenceSceneState } from './useWaveInterferenceSceneState'

type Props = Pick<
  WaveInterferenceSceneState,
  | 'wavelength1' | 'setWavelength1'
  | 'amplitude1' | 'setAmplitude1'
  | 'wavelength2' | 'setWavelength2'
  | 'amplitude2' | 'setAmplitude2'
  | 'phaseDiff' | 'setPhaseDiff'
  | 'waveSpeed'
  | 'playSpeed' | 'setPlaySpeed'
  | 'isPlaying' | 'togglePlay'
  | 'showChart' | 'toggleChart'
  | 'showConstructive' | 'toggleConstructive'
  | 'showDestructive' | 'toggleDestructive'
  | 'reset'
>

export function WaveInterferenceControls({ state }: { state: Props }) {
  return (
    <div className="grid gap-[0.8rem] content-start">
      <h2>波干涉控制</h2>
      <ControlSection title="波源 A (S₁)">
        <RangeField
          id="wi-lambda1"
          label="波长 λ₁"
          unit="m"
          min={0.3}
          max={1.0}
          step={0.05}
          value={state.wavelength1}
          onChange={state.setWavelength1}
        />
        <p className="text-xs opacity-75">f₁ = c / λ₁ = {(state.waveSpeed / state.wavelength1).toFixed(2)} Hz</p>
        <RangeField
          id="wi-amp1"
          label="振幅 A₁"
          unit="m"
          min={0.05}
          max={0.3}
          step={0.01}
          value={state.amplitude1}
          onChange={state.setAmplitude1}
        />
      </ControlSection>
      <ControlSection title="波源 B (S₂)">
        <RangeField
          id="wi-lambda2"
          label="波长 λ₂"
          unit="m"
          min={0.3}
          max={1.0}
          step={0.05}
          value={state.wavelength2}
          onChange={state.setWavelength2}
        />
        <p className="text-xs opacity-75">f₂ = c / λ₂ = {(state.waveSpeed / state.wavelength2).toFixed(2)} Hz</p>
        <RangeField
          id="wi-amp2"
          label="振幅 A₂"
          unit="m"
          min={0.05}
          max={0.3}
          step={0.01}
          value={state.amplitude2}
          onChange={state.setAmplitude2}
        />
      </ControlSection>
      <ControlSection title="相位差">
        <SegmentedControl
          options={[
            { key: '0', label: '同相' },
            { key: `${Math.PI}`, label: '反相' },
          ]}
          value={`${state.phaseDiff}`}
          onChange={(k) => state.setPhaseDiff(Number(k))}
        />
      </ControlSection>
      <ControlSection title="显示">
        <RangeField
          id="wi-speed"
          label="播放速度"
          unit="x"
          min={0.05}
          max={2}
          step={0.05}
          value={state.playSpeed}
          onChange={state.setPlaySpeed}
        />
        <p className="text-xs leading-relaxed opacity-75">播放速度只改变动画时间倍率；波速 c 固定为 {state.waveSpeed.toFixed(1)} m/s，频率由 f = c / λ 决定。</p>
      </ControlSection>
      <SceneActions
        actions={[
          { key: 'play', label: state.isPlaying ? '暂停' : '播放', onClick: state.togglePlay },
          { key: 'chart', label: state.showChart ? '隐藏X-t图' : '显示X-t图', onClick: state.toggleChart },
          { key: 'reset', label: '重置', onClick: state.reset },
        ]}
      />
      <ControlSection title="干涉线">
        <SceneActions
          actions={[
            { key: 'constructive', label: state.showConstructive ? '隐藏相长线' : '显示相长线', onClick: state.toggleConstructive },
            { key: 'destructive', label: state.showDestructive ? '隐藏相消线' : '显示相消线', onClick: state.toggleDestructive },
          ]}
        />
        {Math.abs(state.wavelength1 - state.wavelength2) >= 1e-6 && (
          <p className="text-xs leading-relaxed opacity-80">λ₁ 与 λ₂ 不同会使频率不同，固定相长线和相消线会隐藏。</p>
        )}
      </ControlSection>
      <ControlSection title="操作与图例">
        <p className="text-xs leading-relaxed opacity-80">拖动红色 S₁、蓝色 S₂ 改变波源位置；拖动紫色 O 改变观察点。也可按住 Shift 并单击波面放置 O。</p>
        <p className="text-xs leading-relaxed opacity-80">波面橙色表示正位移（凸起），青色表示负位移（凹陷）；绿色线为相长位置，紫色线为相消位置的平面投影。</p>
        <p className="text-xs leading-relaxed opacity-80">模型采用理想稳态点波源；只有等振幅时，相消线才是波节。</p>
      </ControlSection>
    </div>
  )
}
