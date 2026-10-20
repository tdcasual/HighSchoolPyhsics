import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { useAppStore } from '../../store/useAppStore'
import { LineChart } from '../../ui/charts/LineChart'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { Answer } from '../../ui/notes/Answer'
import { G, flightTime, landingVelocity, maxHeight, pointAt, range, throwExtent } from './model'
import { ProjectileMotionControls } from './ProjectileMotionControls'
import { ProjectileMotionRig3D } from './ProjectileMotionRig3D'
import { useProjectileMotionSceneState } from './useProjectileMotionSceneState'

export function ProjectileMotionScene() {
  const night = useAppStore((store) => store.theme) === 'night'
  const state = useProjectileMotionSceneState()
  const { params } = state
  const now = pointAt(params, state.time)
  const total = flightTime(params)
  const landing = landingVelocity(params)
  const vy0 = params.speed * Math.sin((params.angleDeg * Math.PI) / 180)
  const vyEnd = vy0 - G * total
  const vMax = Math.max(Math.abs(vy0), Math.abs(vyEnd), now.vx, 1)
  // Frame the whole throw: centre on it and back off far enough for its width and height.
  const extent = throwExtent(params)
  const fovTan = Math.tan((38 * Math.PI) / 360)
  const distance = Math.max(extent.width / (2 * fovTan * 1.5), extent.height / (2 * fovTan)) * 1.35
  const target: [number, number, number] = [extent.width / 2, extent.height / 2, 0]

  return (
    <SceneLayout
      timeControl
      controls={<ProjectileMotionControls state={state} />}
      dataOverlay={
        <div className="scene-core-summary-stack">
          <p><span>已知 v₀ · θ · h</span><strong>{params.speed.toFixed(1)} m/s · {params.angleDeg}° · {params.height.toFixed(1)} m</strong></p>
          <p><span>t · 位置 (x, y)</span><strong>{now.t.toFixed(2)} s · ({now.x.toFixed(2)}, {now.y.toFixed(2)}) m</strong></p>
          <p><span>vₓ · vᵧ（向上为正）</span><strong>{now.vx.toFixed(2)} · {now.vy.toFixed(2)} m/s</strong></p>
          <p><span>落地时间 T</span><strong><Answer>{total.toFixed(2)} s</Answer></strong></p>
          <p><span>水平射程 x</span><strong><Answer>{range(params).toFixed(2)} m</Answer></strong></p>
        </div>
      }
      notes={
        <>
          <p>水平方向不受力，vₓ = v₀cosθ 不变，做匀速直线运动；竖直方向只受重力，vᵧ = v₀sinθ − gt，做加速度为 g 的匀变速运动（平抛时 θ = 0，即自由落体）。地面上的蓝点与竖直标尺上的红点分别是小球在两个方向上的“影子”。</p>
          <p>落地速度 {landing.speed.toFixed(2)} m/s，与水平面成 {landing.angleDeg.toFixed(1)}°；最大高度 {maxHeight(params).toFixed(2)} m。平抛的落地时间 t = √(2h/g) 只由高度决定，与 v₀ 无关。g 取 {G} m/s²，不计空气阻力。</p>
        </>
      }
      chart={
        <LineChart
          title="速度分量 v-t 图像"
          ariaLabel="抛体运动水平与竖直速度随时间变化"
          xLabel="t / s"
          yLabel="v / (m·s⁻¹)"
          xDomain={[0, Math.max(total, 0.1)]}
          yDomain={[-vMax * 1.1, vMax * 1.1]}
          cursorX={now.t}
          series={[
            { id: 'vx', label: 'vₓ（匀速）', color: '#2563eb', points: [[0, now.vx], [total, now.vx]] },
            { id: 'vy', label: 'vᵧ（斜率 −g）', color: '#dc2626', points: [[0, vy0], [total, vyEnd]] },
          ]}
        />
      }
      chartVisible
      chartInitiallyCollapsed
      playbackActions={[
        { key: 'play', label: state.running ? '暂停' : state.landed ? '再抛一次' : '抛出', onClick: state.toggleRunning },
        { key: 'step', label: '单步 0.1 s', onClick: state.step, disabled: state.landed },
        { key: 'reset', label: '重置', onClick: state.reset },
      ]}
      viewport={
        <InteractiveCanvas
          camera={{ position: [target[0], target[1] + distance * 0.18, distance], fov: 38 }}
          controls={{ target, minDistance: distance * 0.3, maxDistance: distance * 3 }}
          syncCamera
          adaptiveFraming={false}
          frameloop={state.running ? 'always' : 'demand'}
        >
          <ProjectileMotionRig3D params={params} time={state.time} showComponents={state.showComponents} showStrobe={state.showStrobe} night={night} />
        </InteractiveCanvas>
      }
    />
  )
}

export default ProjectileMotionScene
