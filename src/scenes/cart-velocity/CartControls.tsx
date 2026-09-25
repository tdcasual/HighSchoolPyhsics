import { ControlSection } from '../../ui/controls/ControlSection'
import { RangeField } from '../../ui/controls/RangeField'
import { SceneActions } from '../../ui/controls/SceneActions'
import { SegmentedControl } from '../../ui/controls/SegmentedControl'
import { SelectField } from '../../ui/controls/SelectField'
import { DURATION } from './model'
import { ASSEMBLY_STEPS } from './state'
import type { CartVelocitySceneState } from './useCartVelocitySceneState'
import './cart-velocity.css'

const STAGES = [
  { key: 'observe', label: '观察' },
  { key: 'assemble', label: '装配' },
  { key: 'run', label: '实验' },
  { key: 'measure', label: '测纸带' },
  { key: 'graph', label: '图像' },
]
const VIEWS = [
  { key: 'home', label: '透视' },
  { key: 'front', label: '正视' },
  { key: 'top', label: '俯视' },
  { key: 'focus', label: '小车' },
]
const SKINS = [
  { key: 'classic', label: '小车' },
  { key: 'panda', label: '熊猫' },
  { key: 'rocket', label: '火箭' },
]
const SPEEDS = [
  { key: '0.1', label: '0.1×' },
  { key: '0.25', label: '0.25×' },
  { key: '0.5', label: '0.5×' },
  { key: '1', label: '1×' },
]

export function CartControls({ state }: { state: CartVelocitySceneState }) {
  const motion = state.stage === 'run' || state.stage === 'measure' || state.stage === 'graph'
  return (
    <div className="cart-controls">
      <h2>小车速度控制</h2>
      <ControlSection title="教学内容">
        <SegmentedControl options={STAGES} value={state.stage} onChange={(key) => state.setStage(key as CartVelocitySceneState['stage'])} />
      </ControlSection>
      {state.stage === 'assemble' ? (
        <ControlSection title={`装配 ${state.assembly + 1}/6`}>
          <p className="cart-hint">{ASSEMBLY_STEPS[state.assembly]}</p>
          <SceneActions actions={[
            { key: 'back', label: '上一步', onClick: state.assemblyBack, disabled: state.assembly === 0 },
            { key: 'next', label: state.assembly === 5 ? '装配完成' : '下一步', onClick: state.assemblyNext },
          ]} />
        </ControlSection>
      ) : null}
      {motion ? (
        <ControlSection title="小车与钩码">
          <RangeField id="cart-hooks" label="钩码数量" min={0} max={5} step={1} value={state.hooks} displayValue={state.hooks ? `${state.hooks} 个 · ${state.hooks * 10} g` : '不挂钩码'} onChange={state.setHooks} />
          <RangeField id="cart-v0" label="初速度" min={0.05} max={0.25} step={0.01} value={state.v0} unit="m/s" displayValue={`${state.v0.toFixed(2)} m/s`} onChange={state.setV0} />
          <RangeField id="cart-dh" label="滑轮高度" min={-6} max={6} step={0.5} value={state.dh * 100} unit="cm" displayValue={`${state.dh >= 0 ? '+' : ''}${(state.dh * 100).toFixed(1)} cm`} onChange={(centimetres) => state.setDh(centimetres / 100)} />
          <SceneActions actions={[
            { key: 'accelerated', label: '匀加速', onClick: () => state.setPreset('accelerated') },
            { key: 'uniform', label: '匀速对照', onClick: () => state.setPreset('uniform') },
            { key: 'level', label: '细线调平', onClick: () => state.setDh(0) },
            { key: 'compare', label: '对比 1 到 5', onClick: state.compareAll },
          ]} />
        </ControlSection>
      ) : null}
      {state.stage === 'measure' ? (
        <ControlSection title="计数点">
          <SelectField
            id="cart-group"
            label="计数间隔"
            value={String(state.group)}
            onChange={(value) => state.setGroup(Number(value))}
            options={[
              { value: '5', label: '每 5 个间隔 · T = 0.10 s' },
              { value: '10', label: '每 10 个间隔 · T = 0.20 s' },
            ]}
          />
          {state.points.length ? (
            <SelectField
              id="cart-point"
              label="计数点"
              value={String(state.selected?.index ?? state.points[0].index)}
              onChange={(value) => state.selectPoint(Number(value))}
              options={state.points.map((point) => ({ value: String(point.index), label: `${point.label} · ${point.v.toFixed(3)} m/s` }))}
            />
          ) : (
            <p className="cart-hint">先运行到出现前后计数点，再计算中间时刻速度。</p>
          )}
        </ControlSection>
      ) : null}
      {state.stage === 'graph' ? (
        <ControlSection title="对比">
          <SceneActions actions={[{ key: 'clear', label: '清空对比', onClick: state.clearRuns }]} />
        </ControlSection>
      ) : null}
      <ControlSection title="播放">
        <SegmentedControl options={SPEEDS} value={String(state.speed)} onChange={(key) => state.setSpeed(Number(key))} />
        <RangeField id="cart-time" label="回看时刻" min={0} max={DURATION} step={0.02} value={state.time} unit="s" displayValue={`${state.time.toFixed(2)} s`} onChange={state.setTime} />
      </ControlSection>
      <ControlSection title="外观与视角">
        <SegmentedControl options={SKINS} value={state.skin} onChange={(key) => state.setSkin(key as CartVelocitySceneState['skin'])} />
        <SegmentedControl options={VIEWS} value={state.view} onChange={(key) => state.setView(key as CartVelocitySceneState['view'])} />
      </ControlSection>
      <p className="cart-hint">{state.notice}</p>
    </div>
  )
}
