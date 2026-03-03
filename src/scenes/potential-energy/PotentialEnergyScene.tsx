import { useMemo, useState } from 'react'
import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { SceneActions } from '../../ui/controls/SceneActions'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import {
  buildPotentialSlicePoints,
  POTENTIAL_SURFACE_FULL_ANGLE,
  summarizeSlice,
} from './model'
import { PotentialEnergyRig3D } from './PotentialEnergyRig3D'
import './potential-energy.css'

function resolveChargeLabel(chargeSign: 1 | -1): string {
  return chargeSign > 0 ? '正电荷 (+)' : '负电荷 (-)'
}

export function PotentialEnergyScene() {
  const [chargeSign, setChargeSign] = useState<1 | -1>(1)
  const [sliceVisible, setSliceVisible] = useState(false)
  const [surfaceVisible, setSurfaceVisible] = useState(false)
  const [rotationInProgress, setRotationInProgress] = useState(false)
  const [sweepAngle, setSweepAngle] = useState(0.01)

  const slicePoints = useMemo(() => buildPotentialSlicePoints(chargeSign), [chargeSign])
  const sliceStats = useMemo(() => summarizeSlice(slicePoints), [slicePoints])

  const showSlice = () => {
    setSliceVisible(true)
  }

  const startRotation = () => {
    setSurfaceVisible(true)
    setRotationInProgress(true)
    setSweepAngle(0.01)
  }

  const resetScene = () => {
    setSliceVisible(false)
    setSurfaceVisible(false)
    setRotationInProgress(false)
    setSweepAngle(0.01)
  }

  const toggleChargeSign = () => {
    setChargeSign((value) => (value > 0 ? -1 : 1))
    setRotationInProgress(false)
    if (surfaceVisible) {
      setSweepAngle(POTENTIAL_SURFACE_FULL_ANGLE)
    }
  }

  const chargeTypeLabel = resolveChargeLabel(chargeSign)
  const sweepProgress = Math.min(100, (sweepAngle / POTENTIAL_SURFACE_FULL_ANGLE) * 100)

  return (
    <SceneLayout
      presentationSignals={['chart', 'live-metric']}
      coreSummary={
        <div className="scene-core-summary-stack">
          <p>当前电荷: {chargeTypeLabel}</p>
          <p>
            电势范围: {sliceStats.minPotential.toFixed(2)} ~ {sliceStats.maxPotential.toFixed(2)}
          </p>
          <p>旋转进度: {surfaceVisible ? `${sweepProgress.toFixed(0)}%` : '未开始'}</p>
          <p>教学流程: 切片 {'->'} 旋转生成曲面 {'->'} 比较正负电势形态</p>
        </div>
      }
      controls={
        <>
          <h2>电势图构建控制</h2>

          <div className="potential-energy-sign-card" data-presentation-signal="live-metric">
            <p>点击下方按钮切换电荷极性</p>
            <button className="touch-target potential-energy-toggle" onClick={toggleChargeSign}>
              切换为{chargeSign > 0 ? '负电荷' : '正电荷'}
            </button>
            <p>当前状态: {chargeTypeLabel}</p>
          </div>

          <SceneActions
            actions={[
              {
                key: 'show-slice',
                label: '1. 显示电势切片',
                onClick: showSlice,
                disabled: sliceVisible,
              },
              {
                key: 'start-rotation',
                label: rotationInProgress ? '2. 旋转中...' : '2. 开始旋转',
                onClick: startRotation,
                disabled: !sliceVisible || rotationInProgress,
              },
              {
                key: 'reset',
                label: '3. 重置',
                onClick: resetScene,
                disabled: !sliceVisible && !surfaceVisible,
              },
            ]}
          />

          <div className="potential-energy-readout" data-presentation-signal="chart live-metric">
            <p>切片采样点: {sliceStats.sampleCount}</p>
            <p>曲面展开角: {Math.max(0.01, sweepAngle).toFixed(2)} rad</p>
            <p>旋转状态: {rotationInProgress ? '构建中' : surfaceVisible ? '已完成' : '未开始'}</p>
          </div>

          <div className="structure-card">
            <h3>演示要点</h3>
            <ul>
              <li>电势切片遵循 U(r)=kq/r，离电荷越近绝对值越大。</li>
              <li>将切片绕对称轴旋转可得到三维电势面。</li>
              <li>切换正负电荷后，曲面整体在势能符号上翻转。</li>
            </ul>
          </div>
        </>
      }
      viewport={
        <>
          <InteractiveCanvas
            camera={{ position: [10, 15, 20], fov: 58 }}
            controls={{ target: [0, 5, 0], minDistance: 8, maxDistance: 45 }}
            adaptiveFraming={false}
            frameloop={rotationInProgress ? 'always' : 'demand'}
            wheelZoomIntentGuard
          >
            <PotentialEnergyRig3D
              chargeSign={chargeSign}
              sliceVisible={sliceVisible}
              surfaceVisible={surfaceVisible}
              rotationInProgress={rotationInProgress}
              sweepAngle={sweepAngle}
              onSweepAngleChange={setSweepAngle}
              onRotationComplete={() => setRotationInProgress(false)}
              onChargeClick={toggleChargeSign}
              slicePoints={slicePoints}
            />
          </InteractiveCanvas>
          <p className="potential-energy-viewport-hint" data-presentation-signal="chart">
            操作提示：先点“显示电势切片”，再点“开始旋转”观察从二维曲线到三维电势面的生成过程。
          </p>
        </>
      }
    />
  )
}
