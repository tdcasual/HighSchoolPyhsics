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
  const settingsLocked = state.powered || state.dotCount > 0

  return (
    <div className="grid gap-[0.8rem]">
      <h2>打点计时器控制</h2>

      <fieldset
        disabled={settingsLocked}
        className="m-0 grid min-w-0 gap-[0.8rem] border-0 p-0 disabled:opacity-50"
        aria-label="实验参数"
      >
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
          <>
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
            <p className="ticker-hint" role="note">
              实物通常使用 4–6 V AC；模型用低电压示意漏点、过大振幅示意拖尾，故障阈值仅作定性演示。
            </p>
          </>
        ) : (
          <p className="ticker-hint" role="note">
            电火花计时器使用专用 220 V AC 脉冲电源。这里只作设备示意；真实实验须由教师指导，通电后勿触碰电极与端子。
          </p>
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

      </fieldset>

      {settingsLocked ? (
        <p className="ticker-hint m-0" role="note">
          已有运行点迹；重置后再调整实验参数，避免改写已记录的数据。
        </p>
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
          <li>电火花：纸带从墨粉盘下方通过，纸带带动墨粉盘转动；阻力较小。</li>
          <li>低压漏点是示意性故障。漏点后按实际点迹时间计算 v-t；可见点时间间隔不等时不套用等间隔逐差法。</li>
          <li>相邻两点时间间隔 T = 1/f；50 Hz 时 T = 0.02 s，5 个间隔为 0.10 s。</li>
          <li>纸带到达模型行程或 240 个计时周期上限时自动停止，重置后可再做实验。</li>
          <li>匀速模式假设拉力平衡纸带阻力；匀加速模式显示扣除阻力后的净加速度。</li>
        </ul>
      </div>
    </div>
  )
}
