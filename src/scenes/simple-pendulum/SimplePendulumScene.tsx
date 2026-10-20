import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { useAppStore } from '../../store/useAppStore'
import { LineChart } from '../../ui/charts/LineChart'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { Answer } from '../../ui/notes/Answer'
import { GRAVITY, measuredPeriod, smallAnglePeriod } from './model'
import { SimplePendulumControls } from './SimplePendulumControls'
import { SimplePendulumRig3D } from './SimplePendulumRig3D'
import { useSimplePendulumSceneState } from './useSimplePendulumSceneState'

export function SimplePendulumScene() {
  const night = useAppStore((store) => store.theme) === 'night'
  const s = useSimplePendulumSceneState()
  const { params, state, history } = s
  const period = smallAnglePeriod(params)
  const measured = measuredPeriod(state)
  const amplitudeX = params.length * Math.sin((params.amplitudeDeg * Math.PI) / 180)
  const tEnd = Math.max(3 * period, state.t)
  const tStart = tEnd - 3 * period
  const ideal = Array.from({ length: 121 }, (_, i) => {
    const t = tStart + (3 * period * i) / 120
    return [t, amplitudeX * Math.cos((2 * Math.PI * t) / period)] as [number, number]
  })

  return (
    <SceneLayout
      timeControl
      controls={<SimplePendulumControls state={s} />}
      dataOverlay={
        <div className="scene-core-summary-stack">
          <p><span>已知 L · θ₀ · g</span><strong>{params.length.toFixed(2)} m · {params.amplitudeDeg}° · {GRAVITY[params.gravity]} m/s²</strong></p>
          <p><span>t · 摆角 θ</span><strong>{state.t.toFixed(2)} s · {((state.theta * 180) / Math.PI).toFixed(1)}°</strong></p>
          <p><span>位移 x = L sinθ</span><strong>{(params.length * Math.sin(state.theta) * 100).toFixed(1)} cm</strong></p>
          <p><span>周期 T = 2π√(L/g)</span><strong><Answer>{period.toFixed(3)} s</Answer></strong></p>
          <p><span>实测周期（模拟计时）</span><strong>{measured ? <Answer>{measured.toFixed(3)} s</Answer> : '摆动两次后显示'}</strong></p>
        </div>
      }
      notes={
        <>
          <p>回复力是重力沿切线方向的分力 F回 = −mg sinθ。摆角很小时 sinθ ≈ x/L，F回 ≈ −(mg/L)x，单摆做简谐运动，周期 T = 2π√(L/g) 与摆球质量、振幅无关。</p>
          <p>本场景按精确方程 θ″ = −(g/L) sinθ 计算：摆角较大时实测周期略大于 2π√(L/g)（30° 约大 1.7%），这正是“摆角小于 5°”这一实验要求的原因。x-t 图中虚线为小角近似的余弦曲线。</p>
        </>
      }
      chart={
        <LineChart
          title="位移—时间图像"
          ariaLabel="单摆水平位移随时间变化，与小角近似余弦曲线比较"
          xLabel="t / s"
          yLabel="x / m"
          xDomain={[tStart, tEnd]}
          yDomain={[-amplitudeX * 1.25, amplitudeX * 1.25]}
          cursorX={state.t}
          series={[
            { id: 'ideal', label: '小角近似 x = A cos(2πt/T)', color: '#94a3b8', dashed: true, points: ideal },
            { id: 'x', label: '模拟 x = L sinθ', color: '#2563eb', points: history },
          ]}
        />
      }
      chartVisible
      chartInitiallyCollapsed
      playbackActions={[
        { key: 'toggle-running', label: s.running ? '暂停' : state.t > 0 ? '继续' : '释放', onClick: s.toggleRunning },
        { key: 'step', label: '单步 T/4', onClick: s.step },
        { key: 'reset', label: '重置', onClick: s.reset },
      ]}
      viewport={
        <InteractiveCanvas
          camera={{ position: [0, 2.6, 9], fov: 42 }}
          controls={{ target: [0, 2.6, 0], minDistance: 4, maxDistance: 20 }}
          adaptiveFraming={false}
          frameloop={s.running ? 'always' : 'demand'}
        >
          <SimplePendulumRig3D params={params} state={state} night={night} />
        </InteractiveCanvas>
      }
    />
  )
}

export default SimplePendulumScene
