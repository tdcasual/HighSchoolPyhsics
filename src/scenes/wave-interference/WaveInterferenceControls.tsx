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
      </ControlSection>
      <SceneActions
        actions={[
          { key: 'play', label: state.isPlaying ? '暂停' : '播放', onClick: state.togglePlay },
          { key: 'chart', label: state.showChart ? '隐藏X-t图' : '显示X-t图', onClick: state.toggleChart },
          { key: 'reset', label: '重置', onClick: state.reset },
        ]}
      />
    </div>
  )
}
