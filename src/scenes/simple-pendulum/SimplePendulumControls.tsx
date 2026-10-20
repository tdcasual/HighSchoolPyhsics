import { ControlSection } from '../../ui/controls/ControlSection'
import { RangeField } from '../../ui/controls/RangeField'
import { SegmentedControl } from '../../ui/controls/SegmentedControl'
import type { GravityKey } from './model'
import type { SimplePendulumSceneState } from './useSimplePendulumSceneState'

export function SimplePendulumControls({ state }: { state: SimplePendulumSceneState }) {
  const { params } = state
  return (
    <div className="grid gap-[0.8rem]">
      <h2>单摆控制</h2>
      <ControlSection title="摆">
        <RangeField id="pendulum-length" label="摆长 L" unit="m" min={0.2} max={2} step={0.05} value={params.length} onChange={(length) => state.setParams({ length })} />
        <RangeField id="pendulum-amplitude" label="摆角 θ₀（释放位置）" unit="°" min={2} max={60} step={1} value={params.amplitudeDeg} onChange={(amplitudeDeg) => state.setParams({ amplitudeDeg })} />
        <RangeField id="pendulum-mass" label="摆球质量 m" unit="kg" min={0.05} max={1} step={0.05} value={params.mass} onChange={(mass) => state.setParams({ mass })} />
      </ControlSection>
      <ControlSection title="所在位置">
        <SegmentedControl
          options={[{ key: 'earth', label: '地球 g = 9.8 m/s²' }, { key: 'moon', label: '月球 g = 1.62 m/s²' }]}
          value={params.gravity}
          onChange={(gravity) => state.setParams({ gravity: gravity as GravityKey })}
        />
      </ControlSection>
    </div>
  )
}
