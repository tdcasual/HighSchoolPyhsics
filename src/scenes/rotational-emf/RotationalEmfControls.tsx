import { ModelNote } from '../../ui/notes/ModelNote'
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

      <div className="scene-legend" aria-label="颜色图例">
        <span className="scene-legend-item">
          <i className="scene-legend-dot" style={{ backgroundColor: '#62b0ff' }} aria-hidden="true" />
          蓝色：磁场方向 B
        </span>
        {scenario === 'rod' ? (
          <>
            <span className="scene-legend-item">
              <i className="scene-legend-dot" style={{ backgroundColor: '#f0b64d' }} aria-hidden="true" />
              金色：旋转导体棒
            </span>
            <span className="scene-legend-item">
              <i className="scene-legend-dot" style={{ backgroundColor: '#ff8c42' }} aria-hidden="true" />
              橙色：棒端
            </span>
            <span className="scene-legend-item">
              <i className="scene-legend-dot" style={{ backgroundColor: '#476079' }} aria-hidden="true" />
              深蓝色：棒端圆周轨迹
            </span>
          </>
        ) : (
          <>
            <span className="scene-legend-item">
              <i className="scene-legend-dot" style={{ backgroundColor: '#ff9a3c' }} aria-hidden="true" />
              橙色：转轴侧
            </span>
            <span className="scene-legend-item">
              <i className="scene-legend-dot" style={{ backgroundColor: '#70d4a1' }} aria-hidden="true" />
              绿色：线框边
            </span>
          </>
        )}
      </div>

      <ModelNote>
        <p className="m-0 text-[var(--control-ink-muted)] text-[0.84rem] leading-[1.4]">
          {scenario === 'rod'
            ? '径向导体棒绕与 B 平行的轴转动，L 为棒长；圆环是棒端轨迹示意：ε = ½BωL²。'
            : 'L 为正方形线框边长；θ 从磁场平行线框面的初始位置计，ε = BωL²|cos θ|。θ=0° 时电动势最大。'}
        </p>
      </ModelNote>
      {scenario === 'frame' && viewMode === 'top' && (
        <p className="m-0 text-[var(--control-ink-muted)] text-[0.78rem] leading-[1.35]">
          俯视方向沿转轴观察，线框呈边缘投影；主视图可查看线框平面。
        </p>
      )}
      <ModelNote>
        <p className="m-0 text-[var(--control-ink-muted)] text-[0.78rem] leading-[1.35]">
          几何按统一的 3.4 场景单位/m 示意缩放；只计算电动势大小，不模拟回路电流、极性或非均匀磁场。
        </p>
      </ModelNote>

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
