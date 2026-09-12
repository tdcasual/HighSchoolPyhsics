import { ControlSection } from '../../ui/controls/ControlSection'
import { RangeField } from '../../ui/controls/RangeField'
import { SegmentedControl } from '../../ui/controls/SegmentedControl'
import { VOLUME_PRESETS, type VolumePreset } from './model'
import type { IdealGasIsochoricSceneState } from './useIdealGasIsochoricSceneState'

type Props = { state: IdealGasIsochoricSceneState }

export function IdealGasIsochoricControls({ state }: Props) {
  return <div className="ideal-gas-isochoric-controls grid gap-[0.8rem] content-start">
    <div><h2>理想气体等容变化（查理定律）</h2><p className="ideal-gas-isochoric-subtitle">高中物理数字化交互课件 · 体积锁定、加热加压与绝对零度图像推理</p></div>
    <ControlSection title="选择固定的体积容量（等容线切换）"><SegmentedControl options={Object.entries(VOLUME_PRESETS).map(([key, item]) => ({ key, label: item.label }))} value={state.volumePreset} onChange={(value) => state.setVolumePreset(value as VolumePreset)} columns={3} /></ControlSection>
    <ControlSection title="调节加热平台温度 T"><RangeField id="ideal-gas-isochoric-temperature" label="热力学温度 T" unit="K" min={100} max={420} step={5} value={state.temperatureK} onChange={state.setTemperatureK} showMinMax /></ControlSection>
    <ControlSection title="微观物理机制分析"><ul className="ideal-gas-isochoric-help"><li><strong>等容特征：</strong>体积 V 不变，单位体积内分子数密度保持恒定。</li><li><strong>温度效应：</strong>温度 T 升高，气体分子平均动能增大。</li><li><strong>压强本质：</strong>分子撞击器壁更频繁、力度更大，宏观表现为 p 增大。</li></ul><p className="ideal-gas-isochoric-help-note">按空格键也可暂停/恢复分子热运动；虚线段表示外推到不可达的低温区域。</p></ControlSection>
  </div>
}
