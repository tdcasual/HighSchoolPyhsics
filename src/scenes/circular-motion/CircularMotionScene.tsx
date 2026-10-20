import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { useAppStore } from '../../store/useAppStore'
import { LineChart } from '../../ui/charts/LineChart'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { Answer } from '../../ui/notes/Answer'
import { G, conicalReadings, turntableReadings } from './model'
import { CircularMotionControls } from './CircularMotionControls'
import { CircularMotionRig3D } from './CircularMotionRig3D'
import { useCircularMotionSceneState } from './useCircularMotionSceneState'

const OMEGA_MAX = 8

export function CircularMotionScene() {
  const night = useAppStore((store) => store.theme) === 'night'
  const state = useCircularMotionSceneState()
  const table = turntableReadings(state.turntable)
  const cone = conicalReadings(state.conical)
  const omegas = Array.from({ length: 81 }, (_, index) => (index / 80) * OMEGA_MAX)
  const turntableMode = state.mode === 'turntable'

  return (
    <SceneLayout
      timeControl
      controls={<CircularMotionControls state={state} />}
      dataOverlay={
        turntableMode ? (
          <div className="scene-core-summary-stack">
            <p><span>已知 m · r · ω · μ</span><strong>{state.turntable.mass.toFixed(1)} kg · {state.turntable.radius.toFixed(2)} m · {state.turntable.omega.toFixed(1)} rad/s · {state.turntable.mu.toFixed(2)}</strong></p>
            <p><span>v = ωr · 周期 T</span><strong>{table.speed.toFixed(2)} m/s · {table.period.toFixed(2)} s</strong></p>
            <p><span>向心加速度 aₙ = ω²r</span><strong><Answer>{table.acceleration.toFixed(2)} m/s²</Answer></strong></p>
            <p><span>所需向心力 mω²r / 最大静摩擦 μmg</span><strong><Answer>{table.requiredForce.toFixed(2)} N</Answer> / {table.maxFriction.toFixed(2)} N</strong></p>
            <p><span>物块</span><strong><Answer>{table.slips ? '滑离转盘（离心运动）' : '随转盘一起转动'}</Answer></strong></p>
          </div>
        ) : (
          <div className="scene-core-summary-stack">
            <p><span>已知 m · L · ω</span><strong>{state.conical.mass.toFixed(2)} kg · {state.conical.length.toFixed(2)} m · {state.conical.omega.toFixed(1)} rad/s</strong></p>
            <p><span>绳与竖直方向夹角 θ</span><strong><Answer>{((cone.angle * 180) / Math.PI).toFixed(1)}°</Answer></strong></p>
            <p><span>轨道半径 r = L sinθ</span><strong>{cone.radius.toFixed(3)} m</strong></p>
            <p><span>绳拉力 F拉</span><strong><Answer>{cone.tension.toFixed(3)} N</Answer></strong></p>
            <p><span>周期 T = 2π/ω</span><strong>{cone.period.toFixed(2)} s</strong></p>
          </div>
        )
      }
      notes={
        turntableMode ? (
          <p>
            物块随转盘做匀速圆周运动时，指向圆心的静摩擦力提供向心力 Fₙ = mω²r。所需向心力超过最大静摩擦力 μmg（近似取滑动摩擦力）时，静摩擦不足以维持圆周运动，物块沿切线方向滑离——离心运动。临界角速度 ω = √(μg/r) ={' '}
            {table.criticalOmega.toFixed(2)} rad/s，与质量无关。
          </p>
        ) : (
          <p>
            小球受重力 mg 与绳拉力 F拉，二者的合力水平指向圆心，提供向心力：F拉·cosθ = mg，F拉·sinθ = mω²·L·sinθ，所以 cosθ = g/(ω²L)、F拉 = mω²L。ω ≤ √(g/L) = {cone.thresholdOmega.toFixed(2)} rad/s 时小球只能竖直下垂。
          </p>
        )
      }
      chart={
        turntableMode ? (
          <LineChart
            title="所需向心力 Fₙ 与 ω 的关系"
            ariaLabel="转盘上物块所需向心力随角速度变化，与最大静摩擦力比较"
            xLabel="ω / (rad·s⁻¹)"
            yLabel="F / N"
            xDomain={[0, OMEGA_MAX]}
            yDomain={[0, Math.max(table.maxFriction * 2, state.turntable.mass * OMEGA_MAX ** 2 * state.turntable.radius * 0.6)]}
            cursorX={state.turntable.omega}
            series={[
              { id: 'need', label: 'Fₙ = mω²r', color: '#dc2626', points: omegas.map((w) => [w, state.turntable.mass * w * w * state.turntable.radius]) },
              { id: 'max', label: '最大静摩擦 μmg', color: '#2563eb', dashed: true, points: [[0, table.maxFriction], [OMEGA_MAX, table.maxFriction]] },
            ]}
          />
        ) : (
          <LineChart
            title="偏角 θ 与 ω 的关系"
            ariaLabel="圆锥摆偏角随角速度变化"
            xLabel="ω / (rad·s⁻¹)"
            yLabel="θ / °"
            xDomain={[0, OMEGA_MAX]}
            yDomain={[0, 90]}
            cursorX={state.conical.omega}
            series={[
              {
                id: 'angle',
                label: 'cosθ = g/(ω²L)',
                color: '#ea580c',
                points: omegas.map((w) => [w, w * w * state.conical.length > G ? (Math.acos(G / (w * w * state.conical.length)) * 180) / Math.PI : 0]),
              },
            ]}
          />
        )
      }
      chartVisible
      chartInitiallyCollapsed
      playbackActions={[
        { key: 'toggle-running', label: state.running ? '暂停' : '转动', onClick: state.toggleRunning },
        { key: 'step', label: '单步 15°', onClick: state.step },
        { key: 'reset', label: '重置', onClick: state.reset },
      ]}
      viewport={
        <InteractiveCanvas
          camera={{ position: turntableMode ? [0, 5.5, 6.5] : [0, 4, 10], fov: 42 }}
          controls={{ target: turntableMode ? [0, 0, 0] : [0, 2.2, 0], minDistance: 4, maxDistance: 30 }}
          syncCamera
          adaptiveFraming={false}
          frameloop={state.running ? 'always' : 'demand'}
        >
          <CircularMotionRig3D
            mode={state.mode}
            turntable={state.turntable}
            conical={state.conical}
            phase={state.phase}
            slipDistance={state.slipDistance}
            slipPhase={state.slipPhase}
            night={night}
          />
        </InteractiveCanvas>
      }
    />
  )
}

export default CircularMotionScene
