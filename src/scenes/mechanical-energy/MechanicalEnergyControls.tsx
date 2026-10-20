import { ControlSection } from '../../ui/controls/ControlSection'
import { RangeField } from '../../ui/controls/RangeField'
import { SegmentedControl } from '../../ui/controls/SegmentedControl'
import type { MechanicalEnergySceneState } from './useMechanicalEnergySceneState'

export function MechanicalEnergyControls({ state }: { state: MechanicalEnergySceneState }) {
  const { params } = state
  return (
    <div className="grid gap-[0.8rem]">
      <h2>机械能守恒控制</h2>
      <ControlSection title="轨道">
        <SegmentedControl
          options={[{ key: 'smooth', label: '光滑轨道' }, { key: 'rough', label: '有摩擦' }]}
          value={params.mu > 0 ? 'rough' : 'smooth'}
          onChange={(key) => state.setParams({ mu: key === 'rough' ? 0.08 : 0 })}
        />
        {params.mu > 0 ? (
          <RangeField id="energy-mu" label="动摩擦因数 μ" unit="" min={0.02} max={0.3} step={0.01} value={params.mu} onChange={(mu) => state.setParams({ mu })} />
        ) : null}
      </ControlSection>
      <ControlSection title="小物块">
        <RangeField id="energy-height" label="释放高度 h₀" unit="m" min={0.2} max={2} step={0.1} value={params.releaseHeight} onChange={(releaseHeight) => state.setParams({ releaseHeight })} />
        <RangeField id="energy-mass" label="质量 m" unit="kg" min={0.1} max={2} step={0.1} value={params.mass} onChange={(mass) => state.setParams({ mass })} />
      </ControlSection>
    </div>
  )
}
