import { DataRows } from '../../ui/panels/DataRows'
import { clockActions } from '../../simulation/clockActions'
import { FittedCanvas } from '../../scene3d/FittedCanvas'
import { useMediaQuery } from '../../ui/hooks/useMediaQuery'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { OrthogonalEmWaveChart } from './OrthogonalEmWaveChart'
import { OrthogonalEmWaveControls } from './OrthogonalEmWaveControls'
import { OrthogonalEmWaveRig3D } from './OrthogonalEmWaveRig3D'
import { useOrthogonalEmWaveSceneState } from './useOrthogonalEmWaveSceneState'
import { wrapPhase } from './model'
import './orthogonal-em-wave.css'

export function OrthogonalEmWaveScene() {
  const state = useOrthogonalEmWaveSceneState()
  const isCompactDesktop = useMediaQuery('(min-width: 768px) and (max-width: 1100px)')
  const r = state.readings
  const directionLabel = state.direction === 'right' ? '向右' : '向左'
  // Directions only; the distance fits the wave into the free area for every view.
  const cameraByView = {
    '3d': [9, 7, 14],
    xy: [0, 0, 15],
    xz: [0, 15, 0],
    yz: [14, 0, 0],
  } as const satisfies Record<string, [number, number, number]>
  const cameraUp: [number, number, number] = state.viewMode === 'xz' ? [0, 0, -1] : [0, 1, 0]
  return (
    <SceneLayout
      controls={<OrthogonalEmWaveControls state={state} />}
      viewport={
        <FittedCanvas
          shot={{ from: [...cameraByView[state.viewMode]], to: [0, 0, 0] }}
          refitKey={state.viewMode}
          fov={42}
          cameraUp={cameraUp}
          minDistance={7}
          maxDistance={22}
          maxPolarAngle={Math.PI * 0.9}
          frameloop={state.running ? 'always' : 'demand'}
        >
          <OrthogonalEmWaveRig3D {...state} compactDesktop={isCompactDesktop} />
        </FittedCanvas>
      }
      dataOverlay={
        <DataRows
          className="orthogonal-em-wave-telemetry"
          rows={[
            { label: '传播方向', value: <>{directionLabel}（x 轴）</> },
            { label: '探针相位 φ（模 2π）', value: <>{(wrapPhase(r.phase) / Math.PI).toFixed(2)}π</> },
            {
              label: '探针 E、B（相对值）',
              value: (
                <>
                  {r.probe.e.toFixed(2)} / {r.probe.b.toFixed(2)}
                </>
              ),
              answer: true,
              testId: 'orthogonal-em-wave-fields',
            },
          ]}
        />
      }
      notes={
        <>
          <p>
            仿真频率 fₛᵢₘ = vₛᵢₘ/λ = {r.frequency.toFixed(2)} Hz，波数 k = 2π/λ = {r.waveNumber.toFixed(2)} rad/m。
          </p>
          <p>
            E ⟂ B，且 E×B 指向传播方向；左行时 B 分量反号。场强以峰值归一化为相对值，调速用于教学演示；真空电磁波满足
            v=c、E₀=cB₀。
          </p>
        </>
      }
      chart={<OrthogonalEmWaveChart state={state} />}
      playbackActions={clockActions(
        { running: state.running, toggle: state.toggleRunning, step: state.step },
        {
          playLabel: state.elapsed === 0 ? '开始传播' : '继续传播',
          pauseLabel: '暂停传播',
          stepLabel: '单步 T/4',
          resetLabel: '重置相位',
          onReset: state.reset,
        },
      )}
      chartVisible
      chartInitiallyCollapsed
    />
  )
}

export default OrthogonalEmWaveScene
