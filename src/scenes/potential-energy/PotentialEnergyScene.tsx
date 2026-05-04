import { useMemo, useState } from 'react'
import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { SegmentedControl } from '../../ui/controls/SegmentedControl'
import { ControlSection } from '../../ui/controls/ControlSection'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import {
  buildPotentialSlicePoints,
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
    setRotationInProgress(false)
    if (surfaceVisible) {
      setSweepAngle(POTENTIAL_SURFACE_FULL_ANGLE)
    }
  }

  const chargeTypeLabel = resolveChargeLabel(chargeSign)
  const sweepProgress = Math.min(100, (sweepAngle / POTENTIAL_SURFACE_FULL_ANGLE) * 100)
  const presentationFocus = rotationInProgress
    ? { mode: 'focus' as const, primary: [0, 5, 0] as [number, number, number] }
    : surfaceVisible
      ? { mode: 'compare' as const, primary: [0, 5, 0] as [number, number, number], secondary: [0, 0, 0] as [number, number, number] }
      : { mode: 'overview' as const }

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
        </div>
      }
      playbackActions={[
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
      dataOverlay={
        <div className="scene-core-summary-stack">
          <p>当前电荷: {chargeTypeLabel}</p>
          <p>
            电势范围: {sliceStats.minPotential.toFixed(2)} ~ {sliceStats.maxPotential.toFixed(2)}
          </p>
          <p>旋转进度: {surfaceVisible ? `${sweepProgress.toFixed(0)}%` : '未开始'}</p>
          <p>切片采样点: {sliceStats.sampleCount}</p>
          <p>曲面展开角: {Math.max(0.01, sweepAngle).toFixed(2)} rad</p>
          <p>旋转状态: {rotationInProgress ? '构建中' : surfaceVisible ? '已完成' : '未开始'}</p>
        </div>
      }
      viewport={
        <InteractiveCanvas
          camera={{ position: [10, 15, 20], fov: 58 }}
          controls={{ target: [0, 5, 0], minDistance: 8, maxDistance: 45 }}
          presentationFocus={presentationFocus}
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
