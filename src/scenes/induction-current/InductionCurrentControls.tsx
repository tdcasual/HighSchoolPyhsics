import { SegmentedControl } from '../../ui/controls/SegmentedControl'
import { ControlSection } from '../../ui/controls/ControlSection'
import { DataReadout } from '../../ui/controls/DataReadout'
import type { InductionCurrentSceneState } from './useInductionCurrentSceneState'
import {
  formatCurrentDirection,
  formatFluxChange,
  formatVerticalDirection,
} from './model'

type InductionCurrentControlsProps = {
  state: InductionCurrentSceneState
}

export function InductionCurrentControls({ state }: InductionCurrentControlsProps) {
  const dataReadoutItems =
    state.records.length === 0
      ? [{ label: '实验数据', value: '暂无实验记录' }]
      : state.records.map((record) => ({
          label: `记录 #${record.id}`,
          value: `${formatVerticalDirection(record.originalFieldDirection)} / ${formatFluxChange(record.fluxChange)} / ${formatCurrentDirection(record.inducedCurrentDirection)} / ${formatVerticalDirection(record.inducedFieldDirection)}`,
        }))

  return (
    <div className="induction-current-controls">
      <h2>实验控制台</h2>

      <ControlSection title="磁极设置">
        <SegmentedControl
          options={[
            { key: 's-top-n-down', label: 'S 极在上 (N 下)' },
            { key: 's-bottom-n-up', label: 'S 极在下 (N 上)' },
          ]}
          value={state.poleSetting}
          onChange={(key) => state.setPoleSetting(key as 's-top-n-down' | 's-bottom-n-up')}
        />
      </ControlSection>

      <div className="induction-current-legend" aria-label="颜色图例">
        <span className="induction-current-legend-item">
          <i className="induction-current-dot north" aria-hidden="true" />
          N 极
        </span>
        <span className="induction-current-legend-item">
          <i className="induction-current-dot south" aria-hidden="true" />
          S 极
        </span>
        <span className="induction-current-legend-item">
          <i className="induction-current-dot current" aria-hidden="true" />
          感应电流
        </span>
      </div>

      <ControlSection title="实验数据记录">
        <DataReadout items={dataReadoutItems} />
      </ControlSection>

      <ControlSection title="实验结论" collapsible defaultOpen={false}>
        <ul>
          <li>感应电流方向由"原磁场方向 + 磁通量变化"共同决定。</li>
          <li>磁铁接近线圈时，线圈感应磁场总是阻碍磁通量增加。</li>
          <li>磁铁远离线圈时，线圈感应磁场总是阻碍磁通量减少。</li>
        </ul>
      </ControlSection>
    </div>
  )
}
