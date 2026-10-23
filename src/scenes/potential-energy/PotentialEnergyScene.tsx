import { DataRows } from '../../ui/panels/DataRows'
import { FittedCanvas } from '../../scene3d/FittedCanvas'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { clockActions } from '../../simulation/clockActions'
import { POTENTIAL_DISPLAY_LIMIT, POTENTIAL_DISPLAY_MIN_RADIUS, POTENTIAL_FIELD_SCALE } from './model'
import { PotentialEnergyControls } from './PotentialEnergyControls'
import { PotentialEnergyRig3D } from './PotentialEnergyRig3D'
import { usePotentialEnergySceneState } from './usePotentialEnergySceneState'

export function PotentialEnergyScene() {
  const state = usePotentialEnergySceneState()
  const { sliceStats, surfaceVisible, rotationInProgress, sweepAngle } = state

  return (
    <SceneLayout
      controls={<PotentialEnergyControls state={state} />}
      dataOverlay={
        <DataRows
          rows={[
            { label: '当前电荷', value: state.chargeSign > 0 ? '正电荷 (+)' : '负电荷 (-)' },
            {
              label: '相对电势显示范围',
              value: (
                <>
                  {sliceStats.minPotential.toFixed(2)} ~ {sliceStats.maxPotential.toFixed(2)}
                </>
              ),
            },
            {
              label: '旋转',
              value: surfaceVisible
                ? `${state.sweepProgress.toFixed(0)}% · ${rotationInProgress ? '构建中' : state.complete ? '已完成' : '已暂停'}`
                : '未开始',
            },
            {
              label: '切片',
              value: (
                <>
                  {sliceStats.sampleCount} 点 · 展开角 {surfaceVisible ? sweepAngle.toFixed(2) + ' rad' : '未开始'}
                </>
              ),
            },
          ]}
        />
      }
      notes={
        <>
          <p>
            横轴 r 是到点电荷的距离，竖轴 φ<sub>rel</sub> 是相对电势；模型省略库仑常量 k，使用 φ<sub>rel</sub>(r) =
            sgn(Q)·{POTENTIAL_FIELD_SCALE}/r，仅显示 |φ<sub>rel</sub>| ≤ {POTENTIAL_DISPLAY_LIMIT}（r ≥{' '}
            {POTENTIAL_DISPLAY_MIN_RADIUS.toFixed(2)}）。
          </p>
          <p>彩色球标记电荷极性；旋转切片生成轴对称函数图像，不是实际空间等势面。</p>
        </>
      }
      timeControl
      playbackActions={clockActions(state.transport, {
        playLabel: surfaceVisible ? '继续旋转' : '旋转生成曲面',
        finished: state.complete,
        finishedLabel: '重新旋转',
        stepLabel: '单步 15°',
        onReset: state.reset,
      })}
      viewport={
        <FittedCanvas
          shot={{ from: [18, 24, 38], to: [0, 0, 0] }}
          fov={58}
          minDistance={8}
          maxDistance={60}
          frameloop={state.clock.frameloop}
        >
          <PotentialEnergyRig3D
            chargeSign={state.chargeSign}
            // Opens on the φ–r slice so there is something to discuss immediately; rotating builds the surface.
            sliceVisible
            surfaceVisible={surfaceVisible}
            sweepAngle={sweepAngle}
            onChargeClick={state.toggleChargeSign}
            slicePoints={state.slicePoints}
          />
        </FittedCanvas>
      }
    />
  )
}

export default PotentialEnergyScene
