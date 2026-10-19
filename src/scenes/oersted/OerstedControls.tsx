import { ModelNote } from '../../ui/notes/ModelNote'
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
      <h2>奥斯特实验控制</h2>

      <ControlSection title="课堂预设">
        <SegmentedControl
          options={presetButtons.map((preset) => ({
            key: preset.id,
            label: preset.label,
          }))}
          value={activePreset?.id ?? ''}
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
          label="导线最低净空 h_min"
          unit="m"
          min={0.01}
          max={0.16}
          step={0.005}
          value={wireHeightM}
          onChange={onWireHeightChange}
        />
        <ModelNote><p className="oersted-control-hint">
          I &gt; 0 沿导线箭头方向，I &lt; 0 时电源极性和电流方向反转；h_min 是导线最低表面高于磁针平面的净空。
        </p></ModelNote>
        <p className="oersted-control-hint">拖动三枚磁针可改变它们与导线的相对位置，再通电观察磁针偏转。</p>
        <p className="oersted-control-hint">模型按有限长直导线与水平地磁场计算；电池引线仅作连接示意，不计入磁场。</p>
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
