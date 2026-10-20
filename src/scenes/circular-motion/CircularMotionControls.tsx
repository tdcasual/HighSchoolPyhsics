import { ControlSection } from '../../ui/controls/ControlSection'
import { RangeField } from '../../ui/controls/RangeField'
import { SegmentedControl } from '../../ui/controls/SegmentedControl'
import type { CircularMode } from './model'
import type { CircularMotionSceneState } from './useCircularMotionSceneState'

const modeOptions = [
  { key: 'turntable', label: '转盘上的物块' },
  { key: 'conical', label: '圆锥摆' },
]

export function CircularMotionControls({ state }: { state: CircularMotionSceneState }) {
  return (
    <div className="grid gap-[0.8rem]">
      <h2>圆周运动控制</h2>
      <SegmentedControl options={modeOptions} value={state.mode} onChange={(key) => state.setMode(key as CircularMode)} />
      {state.mode === 'turntable' ? (
        <ControlSection title="转盘与物块">
          <RangeField id="circular-omega" label="角速度 ω" unit="rad/s" min={0.5} max={8} step={0.1} value={state.turntable.omega} onChange={(omega) => state.setTurntable({ omega })} />
          <RangeField id="circular-radius" label="到转轴距离 r" unit="m" min={0.1} max={0.5} step={0.05} value={state.turntable.radius} onChange={(radius) => state.setTurntable({ radius })} />
          <RangeField id="circular-mass" label="物块质量 m" unit="kg" min={0.1} max={1} step={0.1} value={state.turntable.mass} onChange={(mass) => state.setTurntable({ mass })} />
          <RangeField id="circular-mu" label="动摩擦因数 μ（最大静摩擦 μmg）" unit="" min={0.1} max={0.8} step={0.05} value={state.turntable.mu} onChange={(mu) => state.setTurntable({ mu })} />
        </ControlSection>
      ) : (
        <ControlSection title="圆锥摆">
          <RangeField id="conical-omega" label="角速度 ω" unit="rad/s" min={1} max={8} step={0.1} value={state.conical.omega} onChange={(omega) => state.setConical({ omega })} />
          <RangeField id="conical-length" label="摆长 L" unit="m" min={0.3} max={1.5} step={0.05} value={state.conical.length} onChange={(length) => state.setConical({ length })} />
          <RangeField id="conical-mass" label="小球质量 m" unit="kg" min={0.05} max={0.5} step={0.05} value={state.conical.mass} onChange={(mass) => state.setConical({ mass })} />
        </ControlSection>
      )}
    </div>
  )
}
