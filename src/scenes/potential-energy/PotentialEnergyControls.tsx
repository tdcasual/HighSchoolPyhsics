import { ControlSection } from '../../ui/controls/ControlSection'
import { SegmentedControl } from '../../ui/controls/SegmentedControl'
import type { PotentialEnergySceneState } from './usePotentialEnergySceneState'

export function PotentialEnergyControls({ state }: { state: PotentialEnergySceneState }) {
  return (
    <div className="grid gap-[0.8rem]">
      <h2>电势图控制</h2>
      <ControlSection title="电荷极性">
        <SegmentedControl
          options={[
            { key: 'positive', label: '正电荷 (+)' },
            { key: 'negative', label: '负电荷 (-)' },
          ]}
          value={state.chargeSign > 0 ? 'positive' : 'negative'}
          onChange={(key) => state.setChargeSign(key === 'positive' ? 1 : -1)}
        />
      </ControlSection>
    </div>
  )
}
