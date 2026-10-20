import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { useAppStore } from '../../store/useAppStore'
import { LineChart } from '../../ui/charts/LineChart'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { Answer } from '../../ui/notes/Answer'
import { G, energiesOf } from './model'
import { MechanicalEnergyControls } from './MechanicalEnergyControls'
import { MechanicalEnergyRig3D } from './MechanicalEnergyRig3D'
import { useMechanicalEnergySceneState } from './useMechanicalEnergySceneState'

export function MechanicalEnergyScene() {
  const night = useAppStore((store) => store.theme) === 'night'
  const state = useMechanicalEnergySceneState()
  const { params, motion, history } = state
  const e = energiesOf(params, motion)
  const start = params.mass * G * params.releaseHeight
  const tEnd = Math.max(4, history.at(-1)?.t ?? 0)
  const tStart = Math.max(0, tEnd - 12)

  return (
    <SceneLayout
      timeControl
      controls={<MechanicalEnergyControls state={state} />}
      dataOverlay={
        <div className="scene-core-summary-stack">
          <p><span>已知 m · h₀ · μ</span><strong>{params.mass.toFixed(1)} kg · {params.releaseHeight.toFixed(1)} m · {params.mu.toFixed(2)}</strong></p>
          <p><span>高度 h · 速率 v</span><strong>{e.height.toFixed(2)} m · {Math.abs(motion.v).toFixed(2)} m/s</strong></p>
          <p><span>Eₖ = ½mv² · Eₚ = mgh</span><strong>{e.kinetic.toFixed(2)} J · {e.potential.toFixed(2)} J</strong></p>
          <p><span>机械能 E = Eₖ + Eₚ</span><strong><Answer>{e.mechanical.toFixed(2)} J</Answer></strong></p>
          <p><span>最低点速率 √(2gh₀)</span><strong><Answer>{params.mu > 0 ? '小于 ' : ''}{Math.sqrt(2 * G * params.releaseHeight).toFixed(2)} m/s</Answer></strong></p>
        </div>
      }
      notes={
        <>
          <p>以碗底为零势能面。光滑轨道上只有重力做功，Eₖ 与 Eₚ 相互转化而 E = Eₖ + Eₚ = mgh₀ = {start.toFixed(2)} J 保持不变，物块总能回到释放高度 h₀（虚线）。支持力始终与速度垂直，不做功。</p>
          <p>有摩擦时，摩擦力做负功，机械能逐渐转化为内能 Q（棕色柱），E + Q 保持为 mgh₀。轨道为 y = ax² 的碗形，计入了曲率对支持力的影响 N = m(g cosα + v²/ρ)。</p>
        </>
      }
      chart={
        <LineChart
          title="能量随时间变化"
          ariaLabel="动能、势能与机械能随时间变化"
          xLabel="t / s"
          yLabel="E / J"
          xDomain={[tStart, tEnd]}
          yDomain={[0, start * 1.1]}
          cursorX={motion.t}
          series={[
            { id: 'ek', label: 'Eₖ', color: '#dc2626', points: history.map((s) => [s.t, s.kinetic]) },
            { id: 'ep', label: 'Eₚ', color: '#2563eb', points: history.map((s) => [s.t, s.potential]) },
            { id: 'e', label: 'E = Eₖ + Eₚ', color: '#7c3aed', points: history.map((s) => [s.t, s.mechanical]) },
          ]}
        />
      }
      chartVisible
      chartInitiallyCollapsed
      playbackActions={[
        { key: 'play', label: state.running ? '暂停' : motion.stopped ? '重新释放' : motion.t > 0 ? '继续' : '释放', onClick: state.toggleRunning },
        { key: 'step', label: '单步 0.1 s', onClick: state.step, disabled: motion.stopped },
        { key: 'reset', label: '重置', onClick: state.reset },
      ]}
      viewport={
        <InteractiveCanvas
          camera={{ position: [1, 1.6, 9.2], fov: 42 }}
          controls={{ target: [1, 1, 0], minDistance: 4, maxDistance: 20 }}
          adaptiveFraming={false}
          frameloop={state.running ? 'always' : 'demand'}
        >
          <MechanicalEnergyRig3D params={params} motion={motion} night={night} />
        </InteractiveCanvas>
      }
    />
  )
}

export default MechanicalEnergyScene
