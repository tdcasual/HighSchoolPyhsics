import { ControlSection } from '../../ui/controls/ControlSection'
import { RangeField } from '../../ui/controls/RangeField'
import { SceneActions } from '../../ui/controls/SceneActions'
import { SegmentedControl } from '../../ui/controls/SegmentedControl'
import { SelectField } from '../../ui/controls/SelectField'
import { DURATION, fit, hookAcceleration } from './model'
import { ASSEMBLY_STEPS, runFit } from './state'
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
  { key: 'focus', label: '特写' },
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

const APPARATUS = [
  { key: 'timer', title: '电磁打点计时器', description: '50 Hz，每 0.02 s 留下一点' },
  { key: 'cart', title: '实验小车与长木板', description: '小车沿轨道运动并牵引纸带' },
  { key: 'tape', title: '纸带与复写纸', description: '点迹记录小车各时刻的位置' },
  { key: 'power', title: '低压交流电源', description: '给电磁打点计时器供电' },
  { key: 'pulley', title: '定滑轮与钩码', description: '细线牵引小车，钩码提供拉力' },
] as const

export function CartControls({ state }: { state: CartVelocitySceneState }) {
  const motion = state.stage === 'run' || state.stage === 'measure' || state.stage === 'graph'
  return (
    <div className="cart-controls">
      <h2>小车速度控制</h2>
      <ControlSection title="教学内容">
        <SegmentedControl options={STAGES} value={state.stage} onChange={(key) => state.setStage(key as CartVelocitySceneState['stage'])} />
      </ControlSection>
      {state.stage === 'observe' ? (
        <ControlSection title="观察装置">
          <p className="cart-hint">点击部件可放大观察；也可以直接开始实验或进入分步装配。</p>
          <div className="cart-apparatus-list">
            {APPARATUS.map((part) => (
              <button
                key={part.key}
                type="button"
                aria-pressed={state.focusPart === part.key}
                className={state.focusPart === part.key ? 'is-selected' : ''}
                onClick={() => state.setFocusPart(part.key)}
              >
                <strong>{part.title}</strong>
                <span>{part.description}</span>
              </button>
            ))}
          </div>
        </ControlSection>
      ) : null}
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
          <p className="cart-hint">
            {state.dh === 0
              ? <>平行时 a = mg/(M+m)，m = {state.hooks * 10} g，a = {hookAcceleration(state.hooks).toFixed(3)} m/s²。</>
              : '细线偏离水平时，拉力的水平分量与悬挂质量位移约束都会改变加速度。'}
          </p>
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
            <>
              <SelectField
                id="cart-point"
                label="计数点"
                value={String(state.selected?.index ?? state.points[0].index)}
                onChange={(value) => state.selectPoint(Number(value))}
                options={state.points.map((point) => ({ value: String(point.index), label: `${point.label} · ${point.v.toFixed(3)} m/s` }))}
              />
              <div className="cart-measurement-table" role="table" aria-label="纸带各计数点速度测量表">
                <div className="cart-measurement-row cart-measurement-header" role="row">
                  <span role="columnheader">点</span>
                  <span role="columnheader">t / s</span>
                  <span role="columnheader">Δx / cm</span>
                  <span role="columnheader">v / (m/s)</span>
                </div>
                {state.points.map((point) => (
                  <div
                    key={point.index}
                    className={`cart-measurement-row${point.index === state.selected?.index ? ' is-selected' : ''}`}
                    role="row"
                  >
                    <span role="cell">{point.label}</span>
                    <span role="cell">{point.t.toFixed(2)}</span>
                    <span role="cell">{(point.dx * 100).toFixed(2)}</span>
                    <span role="cell">{point.v.toFixed(3)}</span>
                  </div>
                ))}
              </div>
              <p className="cart-hint">v<sub>{state.selected?.label ?? 'B'}</sub> = (x<sub>{state.selected?.right ?? 'C'}</sub> − x<sub>{state.selected?.left ?? 'A'}</sub>) / Δt；计时器频率 50 Hz。</p>
            </>
          ) : (
            <p className="cart-hint">先运行到出现前后计数点，再计算中间时刻速度。</p>
          )}
        </ControlSection>
      ) : null}
      {state.stage === 'graph' ? (
        <ControlSection title="图像分析">
          <label className="cart-check"><input type="checkbox" checked={state.showFit} onChange={(event) => state.setShowFit(event.target.checked)} />显示当前拟合直线</label>
          <label className="cart-check"><input type="checkbox" checked={state.showSlopeTriangle} onChange={(event) => state.setShowSlopeTriangle(event.target.checked)} />显示斜率三角形</label>
          {fit(state.points) ? (
            <p className="cart-hint">
              v = {fit(state.points)?.v0.toFixed(3)} + {fit(state.points)?.a.toFixed(3)}t；
              a = {fit(state.points)?.a.toFixed(3)} m/s²，v₀ = {fit(state.points)?.v0.toFixed(3)} m/s。
            </p>
          ) : (
            <p className="cart-hint">先完成一次实验，取得至少两个纸带测速点，再由 v–t 图线求斜率和截距。</p>
          )}
          <SceneActions actions={[
            { key: 'compare', label: '生成 1–5 钩码对比', onClick: state.compareAll },
            { key: 'clear', label: '清空对比', onClick: state.clearRuns },
          ]} />
          {state.runs.length ? (
            <div className="cart-comparison-table" role="table" aria-label="不同钩码质量的加速度对比">
              <div className="cart-comparison-row cart-comparison-header" role="row">
                <span role="columnheader">钩码</span>
                <span role="columnheader">质量 / g</span>
                <span role="columnheader">水平理论 a</span>
                <span role="columnheader">拟合斜率 a</span>
              </div>
              {state.runs.map((run) => {
                const fitted = runFit(run, state.group)
                return (
                  <div key={run.hooks + ':' + run.v0 + ':' + run.dh} className="cart-comparison-row" role="row">
                    <span role="cell">{run.hooks} 个</span>
                    <span role="cell">{run.hooks * 10}</span>
                    <span role="cell">{hookAcceleration(run.hooks).toFixed(3)}</span>
                    <span role="cell">{fitted ? fitted.a.toFixed(3) : '—'}</span>
                  </div>
                )
              })}
            </div>
          ) : null}
        </ControlSection>
      ) : null}
      <details className="cart-model-notes">
        <summary>公式和模型假设</summary>
        <p>纸带每 0.02 s 打一点（50 Hz）。每个钩码为 10 g，小车质量为 0.50 kg；细线平行木板时 a = mg/(M+m)。</p>
        <p>模型忽略轨道摩擦、车轮和滑轮转动惯量、绳的伸长及计时误差；点迹由理想运动计算生成。滑轮调高时，绳角和悬挂质量的位移约束也进入计算。</p>
      </details>
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
