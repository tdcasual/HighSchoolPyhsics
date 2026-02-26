import type { ReactNode } from 'react'
import { RangeField } from '../../ui/controls/RangeField'
import { SceneActions } from '../../ui/controls/SceneActions'
import type { CyclotronEnergyMode } from './trace'

type CyclotronControlsProps = {
  magneticFieldT: number
  onMagneticFieldChange: (value: number) => void
  electricFieldVPerM: number
  onElectricFieldChange: (value: number) => void
  gapHalfWidthMm: number
  onGapHalfWidthChange: (value: number) => void
  energyMode: CyclotronEnergyMode
  onEnergyModeChange: (value: CyclotronEnergyMode) => void
  running: boolean
  onToggleRunning: () => void
  onReset: () => void
  modeText: string
  cyclotronPeriodS: number
  launchPositionX: number
  voltageDirectionText: string
  currentVoltageV: number
  currentEnergyJ: number
  error: string | null
  charts: ReactNode
}

export function CyclotronControls({
  magneticFieldT,
  onMagneticFieldChange,
  electricFieldVPerM,
  onElectricFieldChange,
  gapHalfWidthMm,
  onGapHalfWidthChange,
  energyMode,
  onEnergyModeChange,
  running,
  onToggleRunning,
  onReset,
  modeText,
  cyclotronPeriodS,
  launchPositionX,
  voltageDirectionText,
  currentVoltageV,
  currentEnergyJ,
  error,
  charts,
}: CyclotronControlsProps) {
  return (
    <>
      <h2>回旋加速器控制</h2>

      <RangeField
        id="cyc-b"
        label="磁场 B (T)"
        min={0.2}
        max={3}
        step={0.1}
        value={magneticFieldT}
        onChange={onMagneticFieldChange}
      />

      <RangeField
        id="cyc-e"
        label="缝隙电场 E (V/m)"
        min={1e4}
        max={2e5}
        step={2000}
        value={electricFieldVPerM}
        onChange={onElectricFieldChange}
      />

      <RangeField
        id="cyc-gap"
        label="加速缝隙半宽 Δx (mm)"
        min={0.02}
        max={0.12}
        step={0.005}
        value={gapHalfWidthMm}
        onChange={onGapHalfWidthChange}
      />

      <div className="cyclotron-mode-switch">
        <button
          className={energyMode === 'ignore-acceleration-time' ? 'active' : ''}
          onClick={() => onEnergyModeChange('ignore-acceleration-time')}
        >
          忽略加速时间
        </button>
        <button
          className={energyMode === 'include-acceleration-time' ? 'active' : ''}
          onClick={() => onEnergyModeChange('include-acceleration-time')}
        >
          考虑加速时间
        </button>
      </div>

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

      <div className="readings">
        <p>模式: {modeText}</p>
        <p>自适应周期 T: {cyclotronPeriodS.toExponential(2)} s</p>
        <p>自适应出发 x0: {launchPositionX.toExponential(2)} m</p>
        <p>电压方向: {voltageDirectionText}</p>
        <p>当前 U: {currentVoltageV.toExponential(2)} V</p>
        <p>当前 Ek: {currentEnergyJ.toExponential(2)} J</p>
        {error ? <p>错误: {error}</p> : null}
      </div>

      {charts}
    </>
  )
}
