import { ModelNote } from '../../ui/notes/ModelNote'
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
    <div className="grid gap-[0.8rem] content-start">
      <h2>交流发电机控制</h2>
      <ModelNote><p className="m-0 text-[var(--control-ink-muted)] text-[0.84rem] leading-[1.4]">
        单匝磁通量 Φ = BS cos θ；e = −N dΦ/dt，峰值 Eₘ = NBSω；外电路固定 R = 8 Ω，按 I = e/R 计算。表针量程为 ±2 A，超量程时会限位。
      </p></ModelNote>
      <p className="m-0 text-[var(--control-ink-muted)] text-[0.8rem] leading-[1.35]">
        N 与 S 均参与公式；转子几何只画单匝示意，尺寸不随匝数或面积改变。
      </p>
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
