import { ControlSection } from '../../ui/controls/ControlSection'
import { RangeField } from '../../ui/controls/RangeField'
import { SceneActions } from '../../ui/controls/SceneActions'
import { SegmentedControl } from '../../ui/controls/SegmentedControl'
import { SelectField } from '../../ui/controls/SelectField'
import { BODIES, type BodyId, type OrbitMode, type Scenario } from './model'
import { minimumOuterOrbitRadius } from './state'
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
  const lesson =
    state.mode === 'synchronous'
      ? [
          '同步卫星：T 等于恒星日，轨道半径约 6.62R。',
          '静止卫星是同步卫星的特例，还要满足赤道面、圆轨道和顺行；倾斜同步轨道的星下点会往返移动。',
        ]
      : state.mode === 'rendezvous'
        ? [
            '内轨角速度大于外轨角速度。',
            '两块扫过扇形表示相同时间间隔，角宽按各自角速度变化。',
            '相邻两次同向共线的会合时间：Tₛ = 2π / |ω₁ − ω₂|。',
          ]
        : state.mode === 'transfer'
          ? [
              '霍曼转移为半个椭圆，地心位于椭圆焦点。',
              '近地点加速进入转移轨道，远地点再次加速进入外圆轨道；椭圆上用 v² = GM(2/r − 1/a)。',
            ]
          : [
              '圆轨道：万有引力提供向心力，GMm/r² = mv²/r。',
              'v = √(GM/r)，ω = √(GM/r³)，T = 2π√(r³/GM)；同一天体的 r³/T² 相同。',
              '黄金代换 GM = g₀R²；第一宇宙速度 v₁ = √(g₀R)，逃逸速度 v₂ = √2v₁。',
            ]
  return (
    <div className="celestial-controls">
      <h2>天体运动控制</h2>
      <ControlSection title="情境">
        <SegmentedControl
          options={PRESET_BUTTONS}
          value=""
          onChange={(key) => state.setPreset(key as CelestialPreset)}
        />
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
          <RangeField
            id="celestial-r2"
            label="外轨道 r2"
            min={minimumOuterOrbitRadius(scenario.q1)}
            max={12}
            step={0.1}
            value={state.r2}
            displayValue={`${scenario.q2.toFixed(2)} R`}
            onChange={state.setR2}
          />
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
        <RangeField
          id="celestial-inc"
          label="轨道倾角"
          min={0}
          max={60}
          step={5}
          value={state.inclinationDeg}
          unit="°"
          displayValue={`${state.inclinationDeg.toFixed(0)}°`}
          onChange={state.setInclination}
        />
        <RangeField
          id="celestial-speed"
          label="演示流速"
          min={0.2}
          max={3}
          step={0.2}
          value={state.timeScale}
          displayValue={`${state.timeScale.toFixed(1)}×`}
          onChange={state.setTimeScale}
        />
      </ControlSection>
      <ControlSection title="显示">
        <SceneActions
          actions={[
            { key: 'vectors', label: state.showVectors ? '矢量开' : '矢量关', onClick: state.toggleVectors },
            { key: 'area', label: state.showArea ? '扫面开' : '扫面关', onClick: state.toggleArea },
            { key: 'plane', label: state.showPlane ? '赤道面开' : '赤道面关', onClick: state.togglePlane },
          ]}
        />
        {state.mode === 'synchronous' ? (
          <SceneActions
            actions={[
              { key: 'corotate', label: state.corotate ? '地面视角' : '惯性视角', onClick: state.toggleCorotate },
            ]}
          />
        ) : null}
      </ControlSection>
      <ControlSection title="观察视角">
        <SegmentedControl options={VIEWS} value={state.view} onChange={(key) => state.setView(key as CelestialView)} />
        <RangeField
          id="celestial-view-elevation"
          label="观察仰角"
          min={16}
          max={74}
          step={1}
          value={state.elevationDeg}
          unit="°"
          displayValue={`${state.elevationDeg.toFixed(0)}°`}
          onChange={state.setElevation}
        />
        <RangeField
          id="celestial-view-azimuth"
          label="绕天体旋转"
          min={-180}
          max={180}
          step={1}
          value={state.azimuthDeg}
          unit="°"
          displayValue={`${state.azimuthDeg.toFixed(0)}°`}
          onChange={state.setAzimuth}
        />
      </ControlSection>
      <details className="celestial-lesson">
        <summary>讲课板书对应情境</summary>
        <p>引力与向心力：GMm/r² = mv²/r。</p>
        {lesson.map((item) => (
          <p key={item}>{item}</p>
        ))}
        <p>改变观察仰角和方位只改变投影，不改变轨道半径、速度和周期。</p>
      </details>
      <p className="celestial-hint">{state.notice}</p>
    </div>
  )
}
