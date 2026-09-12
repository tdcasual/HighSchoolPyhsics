import { ControlSection } from '../../ui/controls/ControlSection'
import { RangeField } from '../../ui/controls/RangeField'
import { SegmentedControl } from '../../ui/controls/SegmentedControl'
import type { MotionMode, TimerKind } from './model'
import type { TickerTimerSceneState } from './useTickerTimerSceneState'
import './ticker-timer.css'

const KIND_OPTIONS = [
  { key: 'electromagnetic', label: '电磁打点' },
  { key: 'spark', label: '电火花' },
]

const MOTION_OPTIONS = [
  { key: 'rest', label: '静止' },
  { key: 'uniform', label: '匀速' },
  { key: 'accelerate', label: '匀加速' },
]

type TickerTimerControlsProps = {
  state: TickerTimerSceneState
}

export function TickerTimerControls({ state }: TickerTimerControlsProps) {
  return (
    <div className="grid gap-[0.8rem]">
      <h2>打点计时器控制</h2>

      <ControlSection title="计时器类型">
        <SegmentedControl
          options={KIND_OPTIONS}
          value={state.kind}
          onChange={(key) => state.setKind(key as TimerKind)}
        />
      </ControlSection>

      <ControlSection title="纸带运动">
        <SegmentedControl
          options={MOTION_OPTIONS}
          value={state.motionMode}
          onChange={(key) => state.setMotionMode(key as MotionMode)}
        />
      </ControlSection>

      <ControlSection title="电源">
        <RangeField
          id="ticker-frequency"
          label="交流频率 f"
          unit="Hz"
          min={40}
          max={60}
          step={1}
          value={state.frequencyHz}
          onChange={state.setFrequencyHz}
        />
        {state.kind === 'electromagnetic' ? (
          <RangeField
            id="ticker-voltage"
            label="工作电压 U"
            unit="V"
            min={3}
            max={9}
            step={0.1}
            value={state.voltageV}
            onChange={state.setVoltageV}
          />
        ) : (
          <p className="ticker-hint">电火花计时器接 220 V 交流市电，按下脉冲开关后放电打点。</p>
        )}
      </ControlSection>

      {state.motionMode === 'uniform' ? (
        <ControlSection title="匀速参数">
          <RangeField
            id="ticker-speed"
            label="拉动速度 v"
            unit="m/s"
            min={0.05}
            max={1.2}
            step={0.05}
            value={state.initialSpeedMps}
            onChange={state.setInitialSpeedMps}
          />
        </ControlSection>
      ) : null}

      {state.motionMode === 'accelerate' ? (
        <ControlSection title="加速参数">
          <RangeField
            id="ticker-accel"
            label="驱动力加速度 a"
            unit="m/s²"
            min={0.4}
            max={6}
            step={0.1}
            value={state.driveAccelerationMps2}
            onChange={state.setDriveAccelerationMps2}
          />
        </ControlSection>
      ) : null}

      <ControlSection title="显示">
        <SegmentedControl
          options={[
            { key: 'on', label: '显示铭牌' },
            { key: 'off', label: '隐藏铭牌' },
          ]}
          value={state.showLabels ? 'on' : 'off'}
          onChange={(key) => state.setShowLabels(key === 'on')}
        />
      </ControlSection>

      <div className="structure-card ticker-notes">
        <h3>课堂要点</h3>
        <ul>
          <li>先通电打点，再释放纸带，避免起始点挤在一起无法计数。</li>
          <li>电磁式：复写纸在上、纸带在下，穿过两侧限位孔。</li>
          <li>电火花：纸带在墨粉盘下面，阻力明显更小。</li>
          <li>相邻两点时间间隔 T = 1/f；50 Hz 时 T = 0.02 s，5 个间隔为 0.10 s。</li>
        </ul>
      </div>
    </div>
  )
}
