import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { useAppStore } from '../../store/useAppStore'
import { LineChart } from '../../ui/charts/LineChart'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { Answer } from '../../ui/notes/Answer'
import { collide, glidersAt, runDuration } from './model'
import { MomentumCollisionControls } from './MomentumCollisionControls'
import { MomentumCollisionRig3D } from './MomentumCollisionRig3D'
import { useMomentumCollisionSceneState } from './useMomentumCollisionSceneState'

const KIND_LABEL = { elastic: '弹性碰撞', inelastic: '非弹性碰撞', 'perfectly-inelastic': '完全非弹性碰撞' } as const

export function MomentumCollisionScene() {
  const night = useAppStore((store) => store.theme) === 'night'
  const state = useMomentumCollisionSceneState()
  const { params } = state
  const out = collide(params)
  const end = runDuration(params)
  const vMax = Math.max(0.2, ...[params.velocityA, params.velocityB, out.velocityAAfter, out.velocityBAfter].map(Math.abs)) * 1.2
  const pMax = Math.max(0.05, Math.abs(out.momentumBefore)) * 1.4
  const times = Array.from({ length: 101 }, (_, i) => (end * i) / 100)
  const now = glidersAt(params, state.time)
  const lost = out.kineticBefore - out.kineticAfter

  return (
    <SceneLayout
      timeControl
      controls={<MomentumCollisionControls state={state} />}
      dataOverlay={
        <div className="scene-core-summary-stack">
          <p><span>已知 m₁ · m₂ · v₁ · v₂</span><strong>{params.massA.toFixed(2)} · {params.massB.toFixed(2)} kg · {params.velocityA.toFixed(2)} · {params.velocityB.toFixed(2)} m/s</strong></p>
          <p><span>碰前总动量 p = m₁v₁ + m₂v₂</span><strong>{out.momentumBefore.toFixed(3)} kg·m/s</strong></p>
          <p><span>碰后 v₁′ · v₂′</span><strong>{out.collides ? <Answer>{out.velocityAAfter.toFixed(2)} · {out.velocityBAfter.toFixed(2)} m/s</Answer> : '不会相碰（v₁ ≤ v₂）'}</strong></p>
          <p><span>碰后总动量 p′</span><strong><Answer>{out.momentumAfter.toFixed(3)} kg·m/s</Answer></strong></p>
          <p><span>动能损失 ΔEₖ</span><strong><Answer>{lost.toFixed(4)} J（{out.kineticBefore > 0 ? ((lost / out.kineticBefore) * 100).toFixed(0) : 0}%）</Answer></strong></p>
        </div>
      }
      notes={
        <>
          <p>气垫导轨上摩擦可忽略，两滑块组成的系统所受合外力为零，碰撞前后总动量守恒：m₁v₁ + m₂v₂ = m₁v₁′ + m₂v₂′。</p>
          <p>
            {KIND_LABEL[params.kind]}：碰后分离速度是接近速度的 e 倍（弹性 e = 1，非弹性此处取 e = 0.5，完全非弹性 e = 0 即粘在一起）。弹性碰撞动能也守恒；等质量弹性碰撞、B 静止时两滑块交换速度。滑块高度与质量成正比。
          </p>
        </>
      }
      chart={
        <LineChart
          title="速度与总动量随时间变化"
          ariaLabel="两滑块速度与系统总动量随时间变化"
          xLabel="t / s"
          yLabel="v / (m·s⁻¹)，p / (kg·m·s⁻¹)"
          xDomain={[0, end]}
          yDomain={[-Math.max(vMax, pMax), Math.max(vMax, pMax)]}
          cursorX={now.t}
          series={[
            { id: 'va', label: 'v₁（A）', color: '#2563eb', points: times.map((t) => [t, glidersAt(params, t).vA]) },
            { id: 'vb', label: 'v₂（B）', color: '#dc2626', points: times.map((t) => [t, glidersAt(params, t).vB]) },
            { id: 'p', label: '总动量 p', color: '#7c3aed', dashed: true, points: [[0, out.momentumBefore], [end, out.momentumAfter]] },
          ]}
        />
      }
      chartVisible
      chartInitiallyCollapsed
      playbackActions={[
        { key: 'play', label: state.running ? '暂停' : state.ended ? '再做一次' : state.time > 0 ? '继续' : '推动滑块', onClick: state.toggleRunning },
        { key: 'step', label: '单步 0.1 s', onClick: state.step, disabled: state.ended },
        { key: 'reset', label: '重置', onClick: state.reset },
      ]}
      viewport={
        <InteractiveCanvas
          camera={{ position: [0, 2.6, 6.4], fov: 42 }}
          controls={{ target: [0, 0.9, 0], minDistance: 3, maxDistance: 20 }}
          adaptiveFraming={false}
          frameloop={state.running ? 'always' : 'demand'}
        >
          <MomentumCollisionRig3D params={params} time={state.time} night={night} />
        </InteractiveCanvas>
      }
    />
  )
}

export default MomentumCollisionScene
