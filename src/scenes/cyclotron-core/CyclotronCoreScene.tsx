import { Answer } from '../../ui/notes/Answer'
import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { useAppStore } from '../../store/useAppStore'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { MOBILE_BREAKPOINT, useMediaQuery } from '../../ui/hooks/useMediaQuery'
import { CyclotronCoreChart } from './CyclotronCoreChart'
import { CyclotronCoreControls } from './CyclotronCoreControls'
import { CyclotronCoreRig3D } from './CyclotronCoreRig3D'
import { REFERENCE_DEVICE_RADIUS_M } from './model'
import { useCyclotronCoreSceneState } from './useCyclotronCoreSceneState'
import './cyclotron-core.css'

export function CyclotronCoreScene() {
  const theme = useAppStore((state) => state.theme)
  const state = useCyclotronCoreSceneState()
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT)
  const readings = state.readings
  // Centered on the D-boxes; the shared safe-area transform moves it clear of the panels.
  const cameraTarget: [number, number, number] = [0, 0, 0]
  const cameraPosition: [number, number, number] = isMobile ? [0, 0, 22] : [0, 0, 16]
  const statusLabel = readings.extracted
    ? '粒子已射出'
    : !state.running && state.elapsed === 0
      ? '待启动'
      : !state.running
        ? '轨迹已暂停'
        : readings.inGap
          ? '正在通过狭缝'
          : 'D 型盒内偏转'

  return (
    <SceneLayout timeControl
      controls={<CyclotronCoreControls state={state} />}
      chartInitiallyCollapsed
      viewport={
        <InteractiveCanvas
          camera={{ position: cameraPosition, fov: 42 }}
          controls={{ target: cameraTarget, minDistance: 7, maxDistance: 20, maxPolarAngle: Math.PI * 0.9 }}
          frameloop={state.running ? 'always' : 'demand'}
        >
          <CyclotronCoreRig3D {...state} theme={theme} />
        </InteractiveCanvas>
      }
      dataOverlay={
        <div className="cyclotron-core-telemetry scene-core-summary-stack">
          <p><span>已知 B · U · R</span><strong>{state.B.toFixed(1)} T · {state.U.toFixed(0)} kV · {(REFERENCE_DEVICE_RADIUS_M * 100).toFixed(2)} cm（示意）</strong></p>
          <p><span>加速次数 n · 动能 Eₖ</span><strong>{readings.accelerationCount} · {readings.energy.toFixed(0)} keV</strong></p>
          <p><span>最大动能 Eₖ,max</span><strong><Answer>{readings.maxEnergy.toFixed(0)} keV</Answer></strong></p>
          <p><span>周期比 T/Tₚ</span><strong><Answer>{readings.periodRatio.toFixed(2)}</Answer></strong></p>
          <p>
            <span>运行状态</span>
            <strong data-testid="cyclotron-core-status" className={`cyclotron-core-status ${readings.extracted ? 'extracted' : readings.inGap ? 'gap' : 'dee'}`}>
              {statusLabel}
            </strong>
          </p>
        </div>
      }
      notes={
        <>
          <p>
            D 形盒有效半径取 {(REFERENCE_DEVICE_RADIUS_M * 100).toFixed(2)} cm 的缩小示意值，使动能落在 keV 量级、轨道圈数可数。Eₖ,max = q²B²R²/(2m) 与 U 无关；按教材常见量级 R = 0.5 m，当前粒子与磁场下 Eₖ,max ≈{' '}
            {((readings.maxEnergy * (0.5 / REFERENCE_DEVICE_RADIUS_M) ** 2) / 1000).toFixed(0)} MeV，加速次数相应增至约 {(readings.maxEnergy * (0.5 / REFERENCE_DEVICE_RADIUS_M) ** 2 / (readings.particle.charge * state.U)).toFixed(0)} 次。
          </p>
          <p>同步条件：非相对论回旋周期 T = 2πm/(qB)，同一磁场下 T/Tₚ = m/q；电源每半周反向，粒子每次过缝获得 qU。</p>
        </>
      }
      chart={<CyclotronCoreChart state={state} />}
      chartVisible
      playbackActions={[
        {
          key: 'toggle-running',
          label: readings.extracted ? '已射出' : state.running ? '暂停轨迹' : readings.accelerationCount > 0 ? '继续轨迹' : '开始加速',
          onClick: state.toggleRunning,
          disabled: readings.extracted,
        },
        { key: 'reset', label: '重置参数', onClick: state.reset },
      ]}
    />
  )
}

export default CyclotronCoreScene
