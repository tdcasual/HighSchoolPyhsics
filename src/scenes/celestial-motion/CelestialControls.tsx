import { ControlSection } from '../../ui/controls/ControlSection'
import { RangeField } from '../../ui/controls/RangeField'
import { SceneActions } from '../../ui/controls/SceneActions'
import { SegmentedControl } from '../../ui/controls/SegmentedControl'
import { SelectField } from '../../ui/controls/SelectField'
import { BODIES, type BodyId, type OrbitMode, type Scenario } from './model'
import type { CelestialPreset, CelestialView } from './state'
import type { CelestialMotionSceneState } from './useCelestialMotionSceneState'
import './celestial-motion.css'

const MODES = [
  { key: 'circular', label: '圆轨道' },
  { key: 'synchronous', label: '同步' },
  { key: 'rendezvous', label: '追及' },
  { key: 'transfer', label: '变轨' },
]
const PRESET_BUTTONS = [
  { key: 'leo', label: '近地' },
  { key: 'sync', label: '倾斜同步' },
  { key: 'geo', label: '静止' },
  { key: 'meet', label: '追及相遇' },
  { key: 'transfer', label: '霍曼' },
]
const VIEWS = [
  { key: 'home', label: '透视' },
  { key: 'equator', label: '赤道' },
  { key: 'pole', label: '极区' },
]

export function CelestialControls({ state, scenario }: { state: CelestialMotionSceneState; scenario: Scenario }) {
  const twoOrbits = state.mode === 'rendezvous' || state.mode === 'transfer'
  const phase = state.mode === 'rendezvous' || state.mode === 'synchronous'
  return (
    <div className="celestial-controls">
      <h2>天体运动控制</h2>
      <ControlSection title="情境">
        <SegmentedControl options={PRESET_BUTTONS} value="" onChange={(key) => state.setPreset(key as CelestialPreset)} />
        <SegmentedControl options={MODES} value={state.mode} onChange={(key) => state.setMode(key as OrbitMode)} />
      </ControlSection>
      <ControlSection title="轨道">
        {state.mode === 'synchronous' ? (
          <p className="celestial-hint">同步半径 {scenario.q1.toFixed(2)} R，由恒星日决定。</p>
        ) : (
          <>
            <SelectField
              id="celestial-body"
              label="中心天体"
              value={state.body}
              onChange={(value) => state.setBody(value as BodyId)}
              options={(Object.keys(BODIES) as BodyId[]).map((id) => ({ value: id, label: BODIES[id].name }))}
            />
            <RangeField
              id="celestial-r1"
              label={twoOrbits ? '内轨道 r1' : '轨道半径 r'}
              min={1.05}
              max={8}
              step={0.05}
              value={state.r1}
              displayValue={`${state.r1.toFixed(2)} R`}
              onChange={state.setR1}
            />
          </>
        )}
        {twoOrbits ? (
          <RangeField id="celestial-r2" label="外轨道 r2" min={1.2} max={12} step={0.1} value={state.r2} displayValue={`${scenario.q2.toFixed(2)} R`} onChange={state.setR2} />
        ) : null}
        {phase ? (
          <RangeField
            id="celestial-phase"
            label={state.mode === 'synchronous' ? '初始经度' : '外轨初相位'}
            min={0}
            max={350}
            step={10}
            value={state.phaseDeg}
            unit="°"
            displayValue={`${state.phaseDeg.toFixed(0)}°`}
            onChange={state.setPhase}
          />
        ) : null}
        <RangeField id="celestial-inc" label="轨道倾角" min={0} max={60} step={5} value={state.inclinationDeg} unit="°" displayValue={`${state.inclinationDeg.toFixed(0)}°`} onChange={state.setInclination} />
        <RangeField id="celestial-speed" label="演示流速" min={0.2} max={3} step={0.2} value={state.timeScale} displayValue={`${state.timeScale.toFixed(1)}×`} onChange={state.setTimeScale} />
      </ControlSection>
      <ControlSection title="显示">
        <SceneActions actions={[
          { key: 'vectors', label: state.showVectors ? '矢量开' : '矢量关', onClick: state.toggleVectors },
          { key: 'area', label: state.showArea ? '扫面开' : '扫面关', onClick: state.toggleArea },
          { key: 'plane', label: state.showPlane ? '赤道面开' : '赤道面关', onClick: state.togglePlane },
        ]} />
        {state.mode === 'synchronous' ? (
          <SceneActions actions={[{ key: 'corotate', label: state.corotate ? '地面视角' : '惯性视角', onClick: state.toggleCorotate }]} />
        ) : null}
      </ControlSection>
      <ControlSection title="观察视角">
        <SegmentedControl options={VIEWS} value={state.view} onChange={(key) => state.setView(key as CelestialView)} />
      </ControlSection>
      <p className="celestial-hint">{state.notice}</p>
    </div>
  )
}
