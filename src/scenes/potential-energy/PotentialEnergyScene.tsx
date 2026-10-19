import { useMemo, useState } from 'react'
import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { SegmentedControl } from '../../ui/controls/SegmentedControl'
import { SceneActions } from '../../ui/controls/SceneActions'
import { ControlSection } from '../../ui/controls/ControlSection'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import {
  buildPotentialSlicePoints,
  POTENTIAL_DISPLAY_LIMIT,
  POTENTIAL_DISPLAY_MIN_RADIUS,
  POTENTIAL_FIELD_SCALE,
  POTENTIAL_SURFACE_FULL_ANGLE,
  summarizeSlice,
} from './model'
import { PotentialEnergyRig3D } from './PotentialEnergyRig3D'

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
    if (surfaceVisible && !rotationInProgress) {
      setSweepAngle(POTENTIAL_SURFACE_FULL_ANGLE)
    }
  }

  const chargeTypeLabel = resolveChargeLabel(chargeSign)
  const sweepProgress = Math.min(100, (sweepAngle / POTENTIAL_SURFACE_FULL_ANGLE) * 100)

  return (
    <SceneLayout
      controls={
        <div className="grid gap-[0.8rem]">
          <h2>电势图控制</h2>

          <ControlSection title="电荷极性">
            <SegmentedControl
              options={[
                { key: 'positive', label: '正电荷 (+)' },
                { key: 'negative', label: '负电荷 (-)' },
              ]}
              value={chargeSign > 0 ? 'positive' : 'negative'}
              onChange={(key) => {
                if ((key === 'positive' && chargeSign < 0) || (key === 'negative' && chargeSign > 0)) {
                  toggleChargeSign()
                }
              }}
            />
          </ControlSection>
          <p className="text-xs leading-relaxed text-[var(--control-ink-muted)]">
            横轴 r 是到点电荷的距离，竖轴 φ_rel 是相对电势；模型省略库仑常量 k，使用 φ_rel(r)=sgn(Q)·{POTENTIAL_FIELD_SCALE}/r，仅显示 |φ_rel|≤{POTENTIAL_DISPLAY_LIMIT}（r≥{POTENTIAL_DISPLAY_MIN_RADIUS.toFixed(2)}）。
            彩色球标记电荷极性；旋转切片生成轴对称函数图像，不是实际空间等势面。
          </p>
          <ControlSection title="三维图像构建">
            <SceneActions
              layout="column"
              actions={[
                { key: 'show-slice', label: '1. 显示电势切片', onClick: showSlice, disabled: sliceVisible },
                { key: 'start-rotation', label: rotationInProgress ? '2. 旋转中...' : '2. 开始旋转', onClick: startRotation, disabled: !sliceVisible || rotationInProgress },
                { key: 'reset', label: '3. 重置', onClick: resetScene, disabled: !sliceVisible && !surfaceVisible },
              ]}
            />
          </ControlSection>
        </div>
      }
      dataOverlay={
        <div className="scene-core-summary-stack">
          <p><span>当前电荷</span><strong>{chargeTypeLabel}</strong></p>
          <p><span>相对电势显示范围</span><strong>{sliceStats.minPotential.toFixed(2)} ~ {sliceStats.maxPotential.toFixed(2)}</strong></p>
          <p><span>旋转</span><strong>{surfaceVisible ? `${sweepProgress.toFixed(0)}% · ${rotationInProgress ? '构建中' : '已完成'}` : '未开始'}</strong></p>
          <p><span>切片</span><strong>{sliceStats.sampleCount} 点 · 展开角 {surfaceVisible ? sweepAngle.toFixed(2) + ' rad' : '未开始'}</strong></p>
          <p className="summary-note">模型 φ_rel(r) = ±{POTENTIAL_FIELD_SCALE}/r，显示域 |φ_rel| ≤ {POTENTIAL_DISPLAY_LIMIT}</p>
        </div>
      }
      viewport={
        <InteractiveCanvas
          camera={{ position: [18, 24, 38], fov: 58 }}
          controls={{ target: [0, 0, 0], minDistance: 8, maxDistance: 60 }}
          adaptiveFraming={false}
          frameloop={rotationInProgress ? 'always' : 'demand'}
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
      }
    />
  )
}

export default PotentialEnergyScene
