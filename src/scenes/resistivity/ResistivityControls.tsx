import { ControlSection } from '../../ui/controls/ControlSection'
import { RangeField } from '../../ui/controls/RangeField'
import { SceneActions } from '../../ui/controls/SceneActions'
import { SegmentedControl } from '../../ui/controls/SegmentedControl'
import { SelectField } from '../../ui/controls/SelectField'
import { ELEMENTS, MATERIALS, type ElementKind, type MaterialKey } from './model'
import type { ResistivitySceneState } from './useResistivitySceneState'
import './resistivity.css'

const STAGES = [
  { key: 'diameter', label: '测直径' },
  { key: 'circuit', label: '接电路' },
  { key: 'analysis', label: '作图' },
  { key: 'iv', label: '伏安特性' },
]
const VIEWS = [
  { key: 'home', label: '全景' },
  { key: 'front', label: '正视' },
  { key: 'top', label: '俯视' },
  { key: 'focus', label: '近看' },
]

export function ResistivityControls({ state }: { state: ResistivitySceneState }) {
  return (
    <div className="resistivity-controls">
      <h2>电阻率测量控制</h2>
      <ControlSection title="实验阶段">
        <SegmentedControl options={STAGES} value={state.stage} onChange={(key) => state.setStage(key as ResistivitySceneState['stage'])} />
      </ControlSection>
      <ControlSection title="金属丝">
        <SelectField
          id="resistivity-material"
          label="材料"
          value={state.mystery ? 'mystery' : state.material}
          onChange={(value) => {
            if (value === 'mystery') state.setMystery(true)
            else {
              state.setMystery(false)
              state.setMaterial(value as MaterialKey)
            }
          }}
          options={[
            ...Object.entries(MATERIALS).map(([value, spec]) => ({ value, label: spec.name })),
            { value: 'mystery', label: '未知金属丝' },
          ]}
        />
        <RangeField id="resistivity-nominal" label="标称直径" min={0.2} max={1} step={0.05} value={state.nominal} unit="mm" displayValue={`${state.nominal.toFixed(2)} mm`} onChange={state.setNominal} />
      </ControlSection>
      {state.stage === 'diameter' ? (
        <ControlSection title="螺旋测微器">
          <SegmentedControl
            options={[{ key: '0', label: '位置 1' }, { key: '1', label: '位置 2' }, { key: '2', label: '位置 3' }]}
            value={String(state.position)}
            onChange={(key) => state.setPosition(Number(key) as 0 | 1 | 2)}
          />
          <RangeField id="resistivity-gap" label="间隙" min={0} max={2} step={0.001} value={state.gap} unit="mm" displayValue={`${state.gap.toFixed(3)} mm`} onChange={state.setGap} />
          <SceneActions actions={[{ key: 'seat', label: '接触金属丝', onClick: state.seat }, { key: 'record-d', label: '记录直径', onClick: state.recordDiameter }]} />
        </ControlSection>
      ) : null}
      {state.stage === 'circuit' || state.stage === 'analysis' ? (
        <ControlSection title="电路">
          <SegmentedControl options={[{ key: 'external', label: '外接' }, { key: 'internal', label: '内接' }]} value={state.method} onChange={(key) => state.setMethod(key as 'external' | 'internal')} />
          <SegmentedControl options={[{ key: 'limit', label: '限流' }, { key: 'divider', label: '分压' }]} value={state.control} onChange={(key) => state.setControl(key as 'limit' | 'divider')} />
          <SegmentedControl options={[{ key: 'A06', label: '0.6 A' }, { key: 'A3', label: '3 A' }]} value={state.ammeter === 'A3' ? 'A3' : 'A06'} onChange={(key) => state.setAmmeter(key as 'A06' | 'A3')} />
          <SegmentedControl options={[{ key: 'V3', label: '3 V' }, { key: 'V15', label: '15 V' }]} value={state.voltmeter === 'V15' ? 'V15' : 'V3'} onChange={(key) => state.setVoltmeter(key as 'V3' | 'V15')} />
          <RangeField id="resistivity-length" label="接入长度 l" min={10} max={50} step={0.5} value={state.lengthCm} unit="cm" displayValue={`${state.lengthCm.toFixed(1)} cm`} onChange={state.setLength} />
          <RangeField id="resistivity-slider" label="滑片" min={0} max={1} step={0.01} value={state.slider} displayValue={state.slider.toFixed(2)} onChange={state.setSlider} />
          <SceneActions actions={[
            { key: 'step', label: state.step >= 3 ? '重新接线' : '下一步接线', onClick: () => state.setStep(state.step >= 3 ? 0 : state.step + 1) },
            { key: 'record', label: '记录 U、I', onClick: state.recordPoint },
            { key: 'sample', label: '示例数据', onClick: state.fillSamples },
          ]} />
        </ControlSection>
      ) : null}
      {state.stage === 'analysis' ? (
        <ControlSection title="图像">
          <SegmentedControl options={[{ key: 'UI', label: 'U–I' }, { key: 'Rl', label: 'R–l' }]} value={state.graph} onChange={(key) => state.setGraph(key as 'UI' | 'Rl')} />
          <SegmentedControl options={[{ key: 'origin', label: '过原点' }, { key: 'line', label: '自由直线' }]} value={state.fit} onChange={(key) => state.setFit(key as 'origin' | 'line')} />
          <SceneActions actions={[{ key: 'clear', label: '清空数据', onClick: state.clearRecords }]} />
        </ControlSection>
      ) : null}
      {state.stage === 'iv' ? (
        <ControlSection title="元件">
          <SegmentedControl options={(Object.keys(ELEMENTS) as ElementKind[]).map((key) => ({ key, label: ELEMENTS[key].short }))} value={state.element} onChange={(key) => state.setElement(key as ElementKind)} />
          <RangeField
            id="resistivity-voltage"
            label="电压 U"
            min={ELEMENTS[state.element].min}
            max={ELEMENTS[state.element].max}
            step={0.01}
            value={state.voltage}
            unit="V"
            displayValue={`${state.voltage.toFixed(2)} V`}
            onChange={state.setVoltage}
          />
        </ControlSection>
      ) : null}
      <ControlSection title="观察视角">
        <SegmentedControl options={VIEWS} value={state.view} onChange={(key) => state.setView(key as ResistivitySceneState['view'])} />
      </ControlSection>
      <p className="resistivity-hint">{state.notice}</p>
    </div>
  )
}
