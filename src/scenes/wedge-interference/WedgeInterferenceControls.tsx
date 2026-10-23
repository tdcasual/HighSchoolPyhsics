import { RangeField } from '../../ui/controls/RangeField'
import { ControlSection } from '../../ui/controls/ControlSection'
import { SceneActions } from '../../ui/controls/SceneActions'
import { SegmentedControl } from '../../ui/controls/SegmentedControl'
import type { WedgeMode } from './model'
import type { WedgeInterferenceSceneState } from './useWedgeInterferenceSceneState'

type WedgeInterferenceControlsProps = {
  state: Pick<
    WedgeInterferenceSceneState,
    | 'wavelength'
    | 'setWavelength'
    | 'wedgeAngle'
    | 'setWedgeAngle'
    | 'mode'
    | 'setMode'
    | 'bumpHeight'
    | 'setBumpHeight'
    | 'bumpPosition'
    | 'setBumpPosition'
    | 'isLightOn'
    | 'toggleLight'
    | 'isScanning'
    | 'toggleScan'
    | 'showChart'
    | 'toggleChart'
    | 'reset'
  >
}

export function WedgeInterferenceControls({ state }: WedgeInterferenceControlsProps) {
  return (
    <div className="grid gap-[0.8rem] content-start">
      <h2>劈尖干涉控制</h2>
      <ControlSection title="光源">
        <RangeField
          id="wedge-wavelength"
          label="波长 λ"
          unit="nm"
          min={400}
          max={700}
          step={1}
          value={state.wavelength}
          onChange={state.setWavelength}
        />
      </ControlSection>
      <ControlSection title="劈尖参数">
        <RangeField
          id="wedge-angle"
          label="劈尖角 θ"
          unit="°"
          min={0.005}
          max={0.3}
          step={0.0001}
          value={state.wedgeAngle}
          onChange={state.setWedgeAngle}
          displayValue={state.wedgeAngle.toFixed(4) + '°'}
        />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          玻璃板倾斜和垫片厚度按示意放大；条纹计算使用实际 θ。
        </p>
      </ControlSection>
      <ControlSection title="下表面">
        <SegmentedControl
          options={[
            { key: 'flat', label: '平整' },
            { key: 'bump', label: '凸起' },
          ]}
          value={state.mode}
          onChange={(key) => state.setMode(key as WedgeMode)}
        />
        {state.mode === 'bump' && (
          <>
            <RangeField
              id="wedge-bump-height"
              label="凸起高度 h（实际）"
              unit="μm"
              min={0.1}
              max={3}
              step={0.1}
              value={state.bumpHeight}
              onChange={state.setBumpHeight}
            />
            <RangeField
              id="wedge-bump-position"
              label="凸起位置"
              unit=""
              min={0.1}
              max={0.9}
              step={0.05}
              value={state.bumpPosition}
              onChange={state.setBumpPosition}
              displayValue={(state.bumpPosition * 100).toFixed(0) + '%'}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">3D 凸起高度按示意放大，光程差按实际 μm 计算。</p>
          </>
        )}
      </ControlSection>
      <SceneActions
        actions={[
          {
            key: 'toggle-light',
            label: state.isLightOn ? '关闭光源' : '打开光源',
            onClick: state.toggleLight,
          },
          {
            key: 'toggle-chart',
            label: state.showChart ? '隐藏条纹图' : '显示条纹图',
            onClick: state.toggleChart,
          },
          {
            key: 'toggle-scan',
            label: state.isScanning ? '停止扫描' : '扫描',
            onClick: state.toggleScan,
          },
          {
            key: 'reset',
            label: '重置',
            onClick: state.reset,
          },
        ]}
      />
    </div>
  )
}
