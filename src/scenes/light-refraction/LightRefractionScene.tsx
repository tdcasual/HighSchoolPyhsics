import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { useAppStore } from '../../store/useAppStore'
import { LineChart } from '../../ui/charts/LineChart'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { Answer } from '../../ui/notes/Answer'
import { MEDIA, refract } from './model'
import { LightRefractionControls } from './LightRefractionControls'
import { LightRefractionRig3D } from './LightRefractionRig3D'
import { useLightRefractionSceneState } from './useLightRefractionSceneState'

export function LightRefractionScene() {
  const night = useAppStore((store) => store.theme) === 'night'
  const predicting = useAppStore((store) => store.predicting)
  const state = useLightRefractionSceneState()
  const { params } = state
  const out = refract(params)
  const angles = Array.from({ length: 90 }, (_, i) => i)
  const curve = angles.map((i) => ({ i, result: refract({ ...params, incidenceDeg: i }) }))

  return (
    <SceneLayout
      timeControl
      controls={<LightRefractionControls state={state} />}
      dataOverlay={
        <div className="scene-core-summary-stack">
          <p><span>已知 n₁ · n₂ · 入射角 i</span><strong>{out.n1.toFixed(2)} · {out.n2.toFixed(2)} · {params.incidenceDeg.toFixed(0)}°</strong></p>
          <p><span>折射角 r（n₁ sin i = n₂ sin r）</span><strong><Answer>{out.refractionDeg === null ? '无（全反射）' : `${out.refractionDeg.toFixed(1)}°`}</Answer></strong></p>
          <p><span>临界角 C（sin C = n₂/n₁）</span><strong>{out.criticalDeg === null ? '无（光由光疏射入光密）' : <Answer>{out.criticalDeg.toFixed(1)}°</Answer>}</strong></p>
          <p><span>反射光能量占比</span><strong>{(out.reflectance * 100).toFixed(1)}%</strong></p>
          <p><span>现象</span><strong><Answer>{out.totalReflection ? '全反射' : '反射 + 折射'}</Answer></strong></p>
        </div>
      }
      notes={
        <>
          <p>折射定律：n₁ sin i = n₂ sin r。光从光密介质射向光疏介质（n₁ &gt; n₂）时，折射角大于入射角；入射角增大到临界角 C（sin C = n₂/n₁）时折射角达到 90°，再增大就只有反射光——全反射。光纤、全反射棱镜都利用这一现象。</p>
          <p>反射光与折射光的能量分配按菲涅耳公式（自然光）计算，图中光线的粗细和亮度随之变化：垂直入射空气—玻璃界面约反射 4%，越接近临界角反射越强。播放会让入射角从当前值逐渐增大。</p>
        </>
      }
      chart={
        <>
          <LineChart
            title="折射角 r 与入射角 i"
            ariaLabel="折射角随入射角变化"
            xLabel="i / °"
            yLabel="r / °"
            xDomain={[0, 90]}
            yDomain={[0, 90]}
            cursorX={params.incidenceDeg}
            series={[
              { id: 'r', label: `${MEDIA[params.from].label} → ${MEDIA[params.to].label}`, color: '#ef4444', points: curve.filter((c) => c.result.refractionDeg !== null).map((c) => [c.i, c.result.refractionDeg!]) },
              { id: 'same', label: 'r = i', color: '#94a3b8', dashed: true, points: [[0, 0], [90, 90]] },
            ]}
          />
          <LineChart
            title="反射光能量占比 R"
            ariaLabel="反射率随入射角变化"
            xLabel="i / °"
            yLabel="R / %"
            xDomain={[0, 90]}
            yDomain={[0, 100]}
            cursorX={params.incidenceDeg}
            series={[{ id: 'R', label: '菲涅耳反射率（自然光）', color: '#2563eb', points: curve.map((c) => [c.i, c.result.reflectance * 100]) }]}
          />
        </>
      }
      chartVisible
      chartInitiallyCollapsed
      playbackActions={[
        { key: 'play', label: state.running ? '暂停' : '增大入射角', onClick: state.toggleRunning },
        { key: 'step', label: '单步 +5°', onClick: state.step },
        { key: 'reset', label: '重置', onClick: state.reset },
      ]}
      viewport={
        <InteractiveCanvas
          camera={{ position: [0, 0.4, 9.5], fov: 42 }}
          controls={{ target: [0, 0, 0], minDistance: 4, maxDistance: 20 }}
          adaptiveFraming={false}
          frameloop={state.running ? 'always' : 'demand'}
        >
          <LightRefractionRig3D params={params} night={night} predicting={predicting} />
        </InteractiveCanvas>
      }
    />
  )
}

export default LightRefractionScene
