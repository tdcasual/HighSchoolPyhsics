import { ControlSection } from '../../ui/controls/ControlSection'
import { RangeField } from '../../ui/controls/RangeField'
import { SceneActions } from '../../ui/controls/SceneActions'
import { SegmentedControl } from '../../ui/controls/SegmentedControl'
import { SelectField } from '../../ui/controls/SelectField'
import { RANGE, RANGES, type RangeKey } from './model'
import type { MultimeterSceneState } from './useMultimeterSceneState'

const STAGES = [
  { key: 'use', label: '使用' },
  { key: 'convert', label: '改装' },
  { key: 'va', label: '内外接' },
  { key: 'rheostat', label: '限流分压' },
]
const TASKS = [
  { key: 'V', label: '电压' },
  { key: 'I', label: '电流' },
  { key: 'R', label: '电阻' },
  { key: 'D', label: '二极管' },
  { key: 'Z', label: '短接' },
]
const DC_VOLTAGE_RANGES = RANGES.filter((range) => range.kind === 'V').map((range) => ({ value: range.key, label: range.label }))
const VIEWS = [
  { key: 'home', label: '全景' },
  { key: 'front', label: '正视' },
  { key: 'focus', label: '表盘' },
  { key: 'top', label: '俯视' },
]

export function MultimeterControls({ state }: { state: MultimeterSceneState }) {
  return (
    <div className="multimeter-controls">
      <h2>多用电表控制</h2>
      <ControlSection title="教学内容">
        <SegmentedControl options={STAGES} value={state.stage} onChange={(key) => state.setStage(key as MultimeterSceneState['stage'])} />
      </ControlSection>
      {state.stage === 'use' ? (
        <ControlSection title="测量">
          <SegmentedControl options={TASKS} value={state.task} onChange={(key) => state.setTask(key as MultimeterSceneState['task'])} />
          <SelectField
            id="multimeter-range"
            label="挡位"
            value={state.range}
            onChange={(value) => state.setRange(value as RangeKey)}
            options={RANGES.map((range) => ({ value: range.key, label: range.label }))}
          />
          {state.task === 'R' ? (
            <RangeField id="multimeter-resistance" label="定值电阻" min={10} max={100000} step={10} value={state.resistance} unit="Ω" displayValue={`${state.resistance.toFixed(0)} Ω`} onChange={state.setResistance} />
          ) : null}
          <RangeField id="multimeter-mech" transient label="机械调零" min={-20} max={20} step={0.1} value={state.mechanical} displayValue={state.mechanicalOk ? '已对准 0' : state.mechanical.toFixed(1)} onChange={state.setMechanical} />
          {RANGE[state.range].kind === 'ohm' ? (
            <RangeField id="multimeter-ohm" label="欧姆调零" min={-20} max={20} step={0.1} value={state.ohmKnob} displayValue={state.ohmOk ? '已调零' : state.ohmKnob.toFixed(1)} onChange={state.setOhmKnob} />
          ) : null}
          <SceneActions actions={[
            { key: 'mech', label: '机械调零', onClick: state.zeroMechanical },
            ...(RANGE[state.range].kind === 'ohm' ? [{ key: 'ohm', label: '欧姆调零', onClick: state.zeroOhm, disabled: state.task !== 'Z' || !state.mechanicalOk }] : []),
            ...(state.task === 'R' ? [{ key: 'best', label: '合适倍率', onClick: state.chooseOhmRange }] : []),
          ]} />
        </ControlSection>
      ) : null}
      {state.stage === 'convert' ? (
        <ControlSection title="表头改装">
          <SegmentedControl options={[{ key: 'V', label: '电压表' }, { key: 'A', label: '电流表' }]} value={state.convKind} onChange={(key) => state.setConvKind(key as 'V' | 'A')} />
          <RangeField id="multimeter-conv-range" label="目标量程" min={state.convKind === 'V' ? 1 : 0.01} max={state.convKind === 'V' ? 15 : 1} step={state.convKind === 'V' ? 0.5 : 0.01} value={state.convRange} displayValue={state.convKind === 'V' ? `${state.convRange.toFixed(1)} V` : `${state.convRange.toFixed(2)} A`} onChange={state.setConvRange} />
          <RangeField id="multimeter-conv-test" label="校准比例" min={0} max={1} step={0.05} value={state.convTest} displayValue={state.convTest.toFixed(2)} onChange={state.setConvTest} />
          <SceneActions actions={[
            { key: 'connect', label: '接入计算值', onClick: state.connectConversion },
            { key: 'reset', label: '重置', onClick: state.reset },
          ]} />
          <p className="multimeter-hint">需要 {state.requiredResistance.toFixed(2)} Ω</p>
        </ControlSection>
      ) : null}
      {state.stage === 'va' ? (
        <ControlSection title="内外接比较">
          <RangeField id="multimeter-lg-rx" label="lg Rx" min={0} max={4} step={0.05} value={state.lgRx} displayValue={`${(10 ** state.lgRx).toFixed(1)} Ω`} onChange={state.setLgRx} />
          <SegmentedControl options={[{ key: 'external', label: '外接法' }, { key: 'internal', label: '内接法' }]} value={state.contactMethod} onChange={(key) => state.setContactMethod(key as 'external' | 'internal')} />
          <SelectField id="multimeter-range" label="电压表量程" value={state.range} onChange={(value) => state.setRange(value as RangeKey)} options={DC_VOLTAGE_RANGES} />
          <p className="multimeter-hint">内外接误差模型固定取 R<sub>A</sub>=1 Ω、R<sub>V</sub>=3 kΩ；挡位只改变表盘满量程。</p>
          <SceneActions actions={[{ key: 'reset', label: '重置', onClick: state.reset }]} />
        </ControlSection>
      ) : null}
      {state.stage === 'rheostat' ? (
        <ControlSection title="滑动变阻器">
          <SegmentedControl
            options={[{ key: 'limit', label: '限流式' }, { key: 'divider', label: '分压式' }]}
            value={state.rheostatMode}
            onChange={(key) => state.setRheostatMode(key as 'limit' | 'divider')}
          />
          <RangeField id="multimeter-slider" label="离 a 端" min={0} max={1} step={0.01} value={state.slider} displayValue={state.slider.toFixed(2)} onChange={state.setSlider} />
          <RangeField id="multimeter-load" label="负载 Rx" min={5} max={200} step={1} value={state.loadResistance} unit="Ω" displayValue={`${state.loadResistance.toFixed(0)} Ω`} onChange={state.setLoad} />
          <SelectField id="multimeter-range" label="电压表量程" value={state.range} onChange={(value) => state.setRange(value as RangeKey)} options={DC_VOLTAGE_RANGES} />
          <SceneActions actions={[
            { key: 'park', label: '安全起始位', onClick: state.parkRheostat },
            { key: 'switch', label: state.rheostatClosed ? '断开开关' : '闭合开关', onClick: state.toggleRheostat },
            { key: 'reset', label: '重置', onClick: state.reset },
          ]} />
        </ControlSection>
      ) : null}
      <ControlSection title="观察视角">
        <SegmentedControl options={VIEWS} value={state.view} onChange={(key) => state.setView(key as MultimeterSceneState['view'])} />
      </ControlSection>
      <p className="multimeter-hint">{state.instruction}</p>
    </div>
  )
}
