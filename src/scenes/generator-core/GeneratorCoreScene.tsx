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
  return <SceneLayout
    controls={<GeneratorCoreControls state={state} />}
    viewport={<InteractiveCanvas camera={{ position: cameraPosition, fov: isMobile ? 48 : 56 }} controls={{ target: cameraTarget, minDistance: 8, maxDistance: 35, maxPolarAngle: Math.PI * 0.82 }} frameloop={state.running ? 'always' : 'demand'}><GeneratorCoreRig3D angleRad={state.angleRad} running={state.running} theme={theme} /></InteractiveCanvas>}
    dataOverlay={<div className="generator-core-telemetry scene-core-summary-stack"><p><span>相位 θ · 位置</span><strong>{angleLabel} · {state.readings.positionLabel}</strong></p><p><span>磁通量</span><strong>{state.readings.fluxNormalized.toFixed(2)} Φₘ</strong></p><p><span>感应电动势</span><strong>{state.readings.emfNormalized.toFixed(2)} Eₘ</strong></p><p><span>切割比例 v⊥/v</span><strong>{Math.abs(state.readings.emfNormalized).toFixed(2)}</strong></p><p><span>电流方向</span><strong>{state.readings.currentDirection}</strong></p><p className="generator-core-conclusion"><span>相位解释</span><strong>{state.description}</strong></p></div>}
    chart={<GeneratorCoreChart angleRad={state.angleRad} running={state.running} />}
    playbackActions={[{ key: 'toggle-running', label: state.running ? '暂停旋转' : '继续旋转', onClick: state.toggleRunning }, { key: 'reset', label: '重置相位', onClick: state.reset }]}
    chartVisible={true}
    chartInitiallyCollapsed
  />
}

export default GeneratorCoreScene

