import { ControlSection } from '../../ui/controls/ControlSection'
import { RangeField } from '../../ui/controls/RangeField'
import { SegmentedControl } from '../../ui/controls/SegmentedControl'
import { PRESETS } from './model'
import type { ProjectileMotionSceneState } from './useProjectileMotionSceneState'

const presetOptions = [
  { key: 'horizontal', label: '平抛' },
  { key: 'oblique', label: '斜抛' },
]

export function ProjectileMotionControls({ state }: { state: ProjectileMotionSceneState }) {
  const { params } = state
  const activePreset = Object.entries(PRESETS).find(
    ([, preset]) => preset.speed === params.speed && preset.angleDeg === params.angleDeg && preset.height === params.height,
  )?.[0]
  return (
    <div className="grid gap-[0.8rem]">
      <h2>抛体运动控制</h2>
      <ControlSection title="典型情境">
        <SegmentedControl options={presetOptions} value={activePreset ?? ''} onChange={(key) => state.applyPreset(key as keyof typeof PRESETS)} />
      </ControlSection>
      <ControlSection title="抛出条件">
        <RangeField id="projectile-speed" label="初速度 v₀" unit="m/s" min={2} max={20} step={0.5} value={params.speed} onChange={state.setSpeed} />
        <RangeField id="projectile-angle" label="抛射角 θ" unit="°" min={0} max={75} step={5} value={params.angleDeg} onChange={state.setAngleDeg} />
        <RangeField id="projectile-height" label="抛出点高度 h" unit="m" min={0} max={20} step={0.5} value={params.height} onChange={state.setHeight} />
      </ControlSection>
      <ControlSection title="显示">
        <SegmentedControl
          options={[{ key: 'on', label: '速度分解' }, { key: 'off', label: '只看合速度' }]}
          value={state.showComponents ? 'on' : 'off'}
          onChange={(key) => state.setShowComponents(key === 'on')}
        />
        <SegmentedControl
          options={[{ key: 'on', label: '频闪点 0.1 s' }, { key: 'off', label: '连续轨迹' }]}
          value={state.showStrobe ? 'on' : 'off'}
          onChange={(key) => state.setShowStrobe(key === 'on')}
        />
      </ControlSection>
    </div>
  )
}
