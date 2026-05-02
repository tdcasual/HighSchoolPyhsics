import { RangeField } from '../../ui/controls/RangeField'
import { SegmentedControl } from '../../ui/controls/SegmentedControl'
import { ControlSection } from '../../ui/controls/ControlSection'
import type { RotationalEmfScenario, RotationalEmfViewMode } from './model'

const scenarioOptions = [
  { key: 'rod', label: '旋转导体棒' },
  { key: 'frame', label: '旋转矩形线框' },
]

const viewModeOptions = [
  { key: 'main', label: '主视图' },
  { key: 'top', label: '俯视图' },
]

type RotationalEmfControlsProps = {
  scenario: RotationalEmfScenario
  onScenarioChange: (value: RotationalEmfScenario) => void
  viewMode: RotationalEmfViewMode
  onViewModeChange: (value: RotationalEmfViewMode) => void
  magneticFieldT: number
  onMagneticFieldChange: (value: number) => void
  angularSpeed: number
  onAngularSpeedChange: (value: number) => void
  effectiveLengthM: number
  onEffectiveLengthChange: (value: number) => void
}

export function RotationalEmfControls({
  scenario,
  onScenarioChange,
  viewMode,
  onViewModeChange,
  magneticFieldT,
  onMagneticFieldChange,
  angularSpeed,
  onAngularSpeedChange,
  effectiveLengthM,
  onEffectiveLengthChange,
}: RotationalEmfControlsProps) {
  return (
    <div className="grid gap-[0.8rem]">
      <h2>旋转切割磁感线控制</h2>

      <ControlSection title="实验类型">
        <SegmentedControl
          options={scenarioOptions}
          value={scenario}
          onChange={(key) => onScenarioChange(key as RotationalEmfScenario)}
        />
      </ControlSection>

      <ControlSection title="视图">
        <SegmentedControl
          options={viewModeOptions}
          value={viewMode}
          onChange={(key) => onViewModeChange(key as RotationalEmfViewMode)}
        />
      </ControlSection>

      <ControlSection title="参数">
        <RangeField
          id="rotational-emf-b"
          label="磁感应强度 B"
          unit="T"
          min={0.2}
          max={3}
          step={0.1}
          value={magneticFieldT}
          onChange={onMagneticFieldChange}
        />
        <RangeField
          id="rotational-emf-omega"
          label="角速度 ω"
          unit="rad/s"
          min={0.2}
          max={3}
          step={0.1}
          value={angularSpeed}
          onChange={onAngularSpeedChange}
        />
        <RangeField
          id="rotational-emf-length"
          label="有效长度 L"
          unit="m"
          min={0.2}
          max={3}
          step={0.1}
          value={effectiveLengthM}
          onChange={onEffectiveLengthChange}
        />
      </ControlSection>
    </div>
  )
}
