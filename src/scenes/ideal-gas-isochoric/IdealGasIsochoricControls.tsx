import { ControlSection } from '../../ui/controls/ControlSection'
import { RangeField } from '../../ui/controls/RangeField'
import { SegmentedControl } from '../../ui/controls/SegmentedControl'
import { ISOCHORIC_TEMPERATURE_RANGE, VOLUME_PRESETS, type VolumePreset } from './model'
import type { IdealGasIsochoricSceneState } from './useIdealGasIsochoricSceneState'

type Props = { state: IdealGasIsochoricSceneState }

export function IdealGasIsochoricControls({ state }: Props) {
  return (
    <div className="ideal-gas-isochoric-controls grid gap-[0.8rem] content-start">
      <div>
        <h2>理想气体等容变化（查理定律）</h2>
        <p className="ideal-gas-isochoric-subtitle">固定气体物质的量 n；每次选定体积后锁定活塞，再升温观察 p–T 关系</p>
      </div>
      <ControlSection title="选定并锁定本次实验体积">
        <SegmentedControl
          options={Object.entries(VOLUME_PRESETS).map(([key, item]) => ({ key, label: item.label }))}
          value={state.volumePreset}
          onChange={(value) => state.setVolumePreset(value as VolumePreset)}
          columns={3}
        />
        <p className="ideal-gas-isochoric-help-note">
          切换体积表示重新设定并锁住活塞；每次实验过程中 V 和 n 均保持不变。
        </p>
      </ControlSection>
      <ControlSection title="调节加热温度 T">
        <RangeField
          id="ideal-gas-isochoric-temperature"
          label="热力学温度 T"
          unit="K"
          min={ISOCHORIC_TEMPERATURE_RANGE.minK}
          max={ISOCHORIC_TEMPERATURE_RANGE.maxK}
          step={5}
          value={state.temperatureK}
          onChange={state.setTemperatureK}
          showMinMax
        />
      </ControlSection>
      <ControlSection title="微观物理机制分析">
        <ul className="ideal-gas-isochoric-help">
          <li>
            <strong>实验条件：</strong>一定量气体，选定体积后活塞锁定，n 与 V 固定。
          </li>
          <li>
            <strong>温度效应：</strong>平均分子速率随 √T 增大，分子与器壁交换动量更快。
          </li>
          <li>
            <strong>压强本质：</strong>单位时间、单位面积的总动量传递增大，所以 p 与 T 成正比。
          </li>
        </ul>
        <p className="ideal-gas-isochoric-help-note">图中 100 K 以下的虚线是理论外推；0 K（−273.15 °C）不可达到。</p>
      </ControlSection>
    </div>
  )
}
