import { RangeField } from '../../ui/controls/RangeField'
import { SegmentedControl } from '../../ui/controls/SegmentedControl'
import { ControlSection } from '../../ui/controls/ControlSection'

type OerstedPresetButton = {
  id: string
  label: string
  active: boolean
  onClick: () => void
}

type OerstedControlsProps = {
  presetButtons: OerstedPresetButton[]
  activePresetTip: string
  currentA: number
  onCurrentChange: (value: number) => void
  earthFieldMicroT: number
  onEarthFieldChange: (value: number) => void
  wireAzimuthDeg: number
  onWireAzimuthChange: (value: number) => void
  wirePitchDeg: number
  onWirePitchChange: (value: number) => void
  wireHeightM: number
  onWireHeightChange: (value: number) => void
  initialHeadingDeg: number
  onInitialHeadingChange: (value: number) => void
}

export function OerstedControls({
  presetButtons,
  activePresetTip,
  currentA,
  onCurrentChange,
  earthFieldMicroT,
  onEarthFieldChange,
  wireAzimuthDeg,
  onWireAzimuthChange,
  wirePitchDeg,
  onWirePitchChange,
  wireHeightM,
  onWireHeightChange,
  initialHeadingDeg,
  onInitialHeadingChange,
}: OerstedControlsProps) {
  const activePreset = presetButtons.find((p) => p.active)

  return (
    <div className="grid gap-[0.8rem]">
      <h2>奥斯特电流磁效应</h2>

      <ControlSection title="课堂预设">
        <SegmentedControl
          options={presetButtons.map((preset) => ({
            key: preset.id,
            label: preset.label,
          }))}
          value={activePreset?.id ?? presetButtons[0]?.id ?? ''}
          onChange={(key) => {
            const preset = presetButtons.find((p) => p.id === key)
            preset?.onClick()
          }}
          columns={3}
        />
        <p className="oersted-preset-tip">{activePresetTip}</p>
      </ControlSection>

      <ControlSection title="基本参数">
        <RangeField
          id="oersted-current"
          label="电流 I"
          unit="A"
          min={-8}
          max={8}
          step={0.2}
          value={currentA}
          onChange={onCurrentChange}
        />

        <RangeField
          id="oersted-wire-height"
          label="导线高度 h"
          unit="m"
          min={0.01}
          max={0.16}
          step={0.005}
          value={wireHeightM}
          onChange={onWireHeightChange}
        />
      </ControlSection>

      <ControlSection title="高级参数" collapsible defaultOpen={false}>
        <RangeField
          id="oersted-earth"
          label="地磁场 B0"
          unit="μT"
          min={20}
          max={70}
          step={1}
          value={earthFieldMicroT}
          onChange={onEarthFieldChange}
        />

        <RangeField
          id="oersted-wire-azimuth"
          label="导线方位角 ψ"
          unit="°"
          min={0}
          max={360}
          step={1}
          value={wireAzimuthDeg}
          onChange={onWireAzimuthChange}
        />

        <RangeField
          id="oersted-wire-pitch"
          label="导线俯仰角 β"
          unit="°"
          min={-50}
          max={50}
          step={1}
          value={wirePitchDeg}
          onChange={onWirePitchChange}
        />

        <RangeField
          id="oersted-heading"
          label="磁针初始方向 θ0"
          unit="°"
          min={0}
          max={360}
          step={1}
          value={initialHeadingDeg}
          onChange={onInitialHeadingChange}
        />
      </ControlSection>
    </div>
  )
}
