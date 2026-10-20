import { ControlSection } from '../../ui/controls/ControlSection'
import { RangeField } from '../../ui/controls/RangeField'
import { SegmentedControl } from '../../ui/controls/SegmentedControl'
import { COLLISION_PRESETS, type CollisionKind } from './model'
import type { MomentumCollisionSceneState } from './useMomentumCollisionSceneState'

const kindOptions = [
  { key: 'elastic', label: '弹性' },
  { key: 'inelastic', label: '非弹性' },
  { key: 'perfectly-inelastic', label: '完全非弹性' },
]

export function MomentumCollisionControls({ state }: { state: MomentumCollisionSceneState }) {
  const { params } = state
  return (
    <div className="grid gap-[0.8rem]">
      <h2>动量守恒控制</h2>
      <ControlSection title="典型情境">
        <div className="scene-actions scene-actions-column">
          {Object.entries(COLLISION_PRESETS).map(([key, preset]) => (
            <button key={key} type="button" className="touch-target" onClick={() => state.applyPreset(key)}>{preset.label}</button>
          ))}
        </div>
      </ControlSection>
      <ControlSection title="碰撞类型">
        <SegmentedControl options={kindOptions} value={params.kind} onChange={(kind) => state.setParams({ kind: kind as CollisionKind })} />
      </ControlSection>
      <ControlSection title="滑块 A（左）">
        <RangeField id="collision-mass-a" label="质量 m₁" unit="kg" min={0.1} max={0.5} step={0.05} value={params.massA} onChange={(massA) => state.setParams({ massA })} />
        <RangeField id="collision-velocity-a" label="速度 v₁（向右为正）" unit="m/s" min={-0.4} max={1} step={0.05} value={params.velocityA} onChange={(velocityA) => state.setParams({ velocityA })} />
      </ControlSection>
      <ControlSection title="滑块 B（右）">
        <RangeField id="collision-mass-b" label="质量 m₂" unit="kg" min={0.1} max={0.5} step={0.05} value={params.massB} onChange={(massB) => state.setParams({ massB })} />
        <RangeField id="collision-velocity-b" label="速度 v₂（向右为正）" unit="m/s" min={-0.6} max={0.4} step={0.05} value={params.velocityB} onChange={(velocityB) => state.setParams({ velocityB })} />
      </ControlSection>
    </div>
  )
}
