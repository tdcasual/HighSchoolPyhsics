import { ControlSection } from '../../ui/controls/ControlSection'
import { RangeField } from '../../ui/controls/RangeField'
import { SegmentedControl } from '../../ui/controls/SegmentedControl'
import { MEDIA, type MediumKey } from './model'
import { REFRACTION_PRESETS, type LightRefractionSceneState } from './useLightRefractionSceneState'

const mediumOptions = Object.entries(MEDIA).map(([key, medium]) => ({ key, label: `${medium.label} ${medium.n.toFixed(2)}` }))

export function LightRefractionControls({ state }: { state: LightRefractionSceneState }) {
  const { params } = state
  return (
    <div className="grid gap-[0.8rem]">
      <h2>光的折射控制</h2>
      <ControlSection title="典型情境">
        <div className="scene-actions scene-actions-column">
          {Object.entries(REFRACTION_PRESETS).map(([key, preset]) => (
            <button key={key} type="button" className="touch-target" onClick={() => state.setParams({ from: preset.from, to: preset.to })}>{preset.label}</button>
          ))}
        </div>
      </ControlSection>
      <ControlSection title="光从（上方介质）">
        <SegmentedControl options={mediumOptions} value={params.from} onChange={(from) => state.setParams({ from: from as MediumKey })} />
      </ControlSection>
      <ControlSection title="射入（下方介质）">
        <SegmentedControl options={mediumOptions} value={params.to} onChange={(to) => state.setParams({ to: to as MediumKey })} />
      </ControlSection>
      <ControlSection title="入射角">
        <RangeField id="refraction-incidence" label="入射角 i" unit="°" min={0} max={89} step={1} value={Math.round(params.incidenceDeg)} onChange={(incidenceDeg) => state.setParams({ incidenceDeg })} />
      </ControlSection>
    </div>
  )
}
