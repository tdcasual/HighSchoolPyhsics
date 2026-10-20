import { DataRows } from '../../ui/panels/DataRows'
import { clockActions } from '../../simulation/clockActions'
import { useMemo } from 'react'
import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { useAppStore } from '../../store/useAppStore'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { MOBILE_BREAKPOINT, useMediaQuery } from '../../ui/hooks/useMediaQuery'
import { GeneratorCoreChart } from './GeneratorCoreChart'
import { GeneratorCoreControls } from './GeneratorCoreControls'
import { GeneratorCoreRig3D } from './GeneratorCoreRig3D'
import { useGeneratorCoreSceneState } from './useGeneratorCoreSceneState'
import './generator-core.css'

export function GeneratorCoreScene() {
  const theme = useAppStore((state) => state.theme)
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT)
  const state = useGeneratorCoreSceneState()
  const angleLabel = useMemo(() => `${state.readings.angleDeg.toFixed(1)}°`, [state.readings.angleDeg])
  const cameraPosition: [number, number, number] = isMobile ? [16, 8, 16] : [11.5, 8.2, 15.4]
  const cameraTarget: [number, number, number] = [0, 0, 0]
  return <SceneLayout timeControl
    controls={<GeneratorCoreControls state={state} />}
    viewport={<InteractiveCanvas camera={{ position: cameraPosition, fov: isMobile ? 48 : 56 }} controls={{ target: cameraTarget, minDistance: 8, maxDistance: 35, maxPolarAngle: Math.PI * 0.82 }} frameloop={state.running ? 'always' : 'demand'}><GeneratorCoreRig3D angleRad={state.angleRad} running={state.running} theme={theme} /></InteractiveCanvas>}
    dataOverlay={<DataRows
          className="generator-core-telemetry"
          rows={[
            { label: '相位 θ · 位置', value: <>{angleLabel} · {state.readings.positionLabel}</> },
            { label: '磁通量', value: <>{state.readings.fluxNormalized.toFixed(2)} Φₘ</>, answer: true },
            { label: '感应电动势', value: <>{state.readings.emfNormalized.toFixed(2)} Eₘ</>, answer: true },
            { label: '电流方向', value: state.readings.currentDirection, answer: true },
          ]}
        />}
    notes={<><p>{state.description}</p><p>切割比例 v⊥/v = |sinθ| = {Math.abs(state.readings.emfNormalized).toFixed(2)}，与 e/Eₘ 相等。</p></>}
    chart={<GeneratorCoreChart angleRad={state.angleRad} running={state.running} />}
    playbackActions={clockActions({ running: state.running, toggle: state.toggleRunning, step: state.step }, { playLabel: '继续旋转', pauseLabel: '暂停旋转', stepLabel: '单步 15°', resetLabel: '重置相位', onReset: state.reset })}
    chartVisible={true}
    chartInitiallyCollapsed
  />
}

export default GeneratorCoreScene

