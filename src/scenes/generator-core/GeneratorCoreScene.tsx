import { useMemo } from 'react'
import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { useAppStore } from '../../store/useAppStore'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { GeneratorCoreChart } from './GeneratorCoreChart'
import { GeneratorCoreControls } from './GeneratorCoreControls'
import { GeneratorCoreRig3D } from './GeneratorCoreRig3D'
import { useGeneratorCoreSceneState } from './useGeneratorCoreSceneState'
import './generator-core.css'

export function GeneratorCoreScene() {
  const theme = useAppStore((state) => state.theme)
  const state = useGeneratorCoreSceneState()
  const angleLabel = useMemo(() => `${state.readings.angleDeg.toFixed(1)}°`, [state.readings.angleDeg])
  return <SceneLayout
    controls={<GeneratorCoreControls state={state} />}
    viewport={<InteractiveCanvas camera={{ position: [11.5, 8.2, 15.4], fov: 42 }} controls={{ target: [0, 0, 0], minDistance: 8, maxDistance: 25, maxPolarAngle: Math.PI * 0.82 }} frameloop={state.running ? 'always' : 'demand'}><GeneratorCoreRig3D angleRad={state.angleRad} running={state.running} theme={theme} /></InteractiveCanvas>}
    dataOverlay={<div className="generator-core-telemetry"><p><span>线圈旋转角度 θ</span><strong>{angleLabel}</strong></p><p><span>磁通量 Φ</span><strong>{state.readings.fluxNormalized.toFixed(2)} Φₘ</strong></p><p><span>电动势 e</span><strong>{state.readings.emfNormalized.toFixed(2)} Eₘ</strong></p><p><span>当前位置</span><strong>{state.readings.positionLabel}</strong></p><p><span>线圈切割动作</span><strong>{state.readings.cuttingLabel}</strong></p><p><span>电流方向</span><strong>{state.readings.currentDirection}</strong></p><p className="generator-core-conclusion"><span>相位解释</span><strong>{state.description}</strong></p></div>}
    chart={<GeneratorCoreChart angleRad={state.angleRad} running={state.running} />}
    playbackActions={[{ key: 'toggle-running', label: state.running ? '暂停旋转' : '继续旋转', onClick: state.toggleRunning }, { key: 'reset', label: '重置相位', onClick: state.reset }]}
    chartVisible={true}
  />
}

export default GeneratorCoreScene

