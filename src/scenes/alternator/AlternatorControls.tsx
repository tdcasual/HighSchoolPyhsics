import { RangeField } from '../../ui/controls/RangeField'
import { ControlSection } from '../../ui/controls/ControlSection'
import type { AlternatorSceneState } from './useAlternatorSceneState'

type AlternatorControlsProps = {
  state: Pick<AlternatorSceneState,
    | 'magneticFieldT' | 'setMagneticFieldT'
    | 'angularSpeedRad' | 'setAngularSpeedRad'
    | 'turnCount' | 'setTurnCount'
    | 'coilAreaM2' | 'setCoilAreaM2'
  >
}

export function AlternatorControls({ state }: AlternatorControlsProps) {
  return (
    <div className="alternator-controls">
      <h2>交流发电机控制</h2>
      <ControlSection title="参数">
        <RangeField id="alternator-speed" label="转速 ω" unit="rad/s" min={0.5} max={12} step={0.1}
          value={state.angularSpeedRad} onChange={state.setAngularSpeedRad} />
        <RangeField id="alternator-b" label="磁场 B" unit="T" min={0.4} max={1.8} step={0.1}
          value={state.magneticFieldT} onChange={state.setMagneticFieldT} />
        <RangeField id="alternator-turns" label="线圈匝数 N" min={8} max={32} step={1}
          value={state.turnCount} onChange={state.setTurnCount} />
        <RangeField id="alternator-area" label="线圈面积 S" unit="m²" min={0.08} max={0.36} step={0.01}
          value={state.coilAreaM2} onChange={state.setCoilAreaM2} />
      </ControlSection>
    </div>
  )
}
