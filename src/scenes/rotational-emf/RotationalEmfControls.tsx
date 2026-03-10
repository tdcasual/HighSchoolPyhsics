import { RangeField } from '../../ui/controls/RangeField'
import { SceneActions } from '../../ui/controls/SceneActions'
import type { RotationalEmfScenario, RotationalEmfViewMode } from './model'

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
  angleLabel: string
  emfMagnitudeLabel: string
  running: boolean
  onToggleRunning: () => void
  onReset: () => void
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
  angleLabel,
  emfMagnitudeLabel,
  running,
  onToggleRunning,
  onReset,
}: RotationalEmfControlsProps) {
  return (
    <div className="rotational-emf-controls">
      <h2>旋转切割磁感线控制</h2>

      <div className="subsection">
        <h3>实验类型</h3>
        <div className="rotational-emf-button-row">
          <button
            type="button"
            className={`touch-target rotational-emf-toggle ${scenario === 'rod' ? 'active' : ''}`.trim()}
            aria-pressed={scenario === 'rod'}
            onClick={() => onScenarioChange('rod')}
          >
            旋转导体棒
          </button>
          <button
            type="button"
            className={`touch-target rotational-emf-toggle ${scenario === 'frame' ? 'active' : ''}`.trim()}
            aria-pressed={scenario === 'frame'}
            onClick={() => onScenarioChange('frame')}
          >
            旋转矩形线框
          </button>
        </div>
      </div>

      <div className="subsection">
        <h3>视图</h3>
        <div className="rotational-emf-button-row">
          <button
            type="button"
            className={`touch-target rotational-emf-toggle ${viewMode === 'main' ? 'active' : ''}`.trim()}
            aria-pressed={viewMode === 'main'}
            onClick={() => onViewModeChange('main')}
          >
            主视图
          </button>
          <button
            type="button"
            className={`touch-target rotational-emf-toggle ${viewMode === 'top' ? 'active' : ''}`.trim()}
            aria-pressed={viewMode === 'top'}
            onClick={() => onViewModeChange('top')}
          >
            俯视图
          </button>
        </div>
      </div>

      <RangeField
        id="rotational-emf-b"
        label="磁感应强度 B"
        min={0.2}
        max={3}
        step={0.1}
        value={magneticFieldT}
        onChange={onMagneticFieldChange}
      />
      <RangeField
        id="rotational-emf-omega"
        label="角速度 ω"
        min={0.2}
        max={3}
        step={0.1}
        value={angularSpeed}
        onChange={onAngularSpeedChange}
      />
      <RangeField
        id="rotational-emf-length"
        label="有效长度 L"
        min={0.2}
        max={3}
        step={0.1}
        value={effectiveLengthM}
        onChange={onEffectiveLengthChange}
      />

      <SceneActions
        actions={[
          {
            key: 'toggle-running',
            label: running ? '暂停' : '播放',
            onClick: onToggleRunning,
          },
          {
            key: 'reset',
            label: '重置',
            onClick: onReset,
          },
        ]}
      />

      <div className="rotational-emf-readout" data-presentation-signal="live-metric interactive-readout">
        <p>
          实验类型：<span data-testid="rotational-emf-scenario">{scenario === 'rod' ? '旋转导体棒' : '旋转矩形线框'}</span>
        </p>
        <p>
          当前视图：<span data-testid="rotational-emf-view">{viewMode === 'main' ? '主视图' : '俯视图'}</span>
        </p>
        <p>当前转角：{angleLabel}</p>
        <p className="rotational-emf-readout-label">感应电动势</p>
        <p className="rotational-emf-readout-value" data-testid="rotational-emf-display">{emfMagnitudeLabel}</p>
      </div>
    </div>
  )
}
