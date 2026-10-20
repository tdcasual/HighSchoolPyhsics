import { recall, useRemember } from '../../app/sceneMemory/sceneMemory'
import { DataRows } from '../../ui/panels/DataRows'
import { clockActions } from '../../simulation/clockActions'
import { useMemo, useState } from 'react'
import { deriveDeflectionFromVoltage } from './runtime'
import { compileVoltageExpression } from './expression'
import { OscilloscopeCrt3D } from './OscilloscopeCrt3D'
import { OscilloscopeDisplay } from './OscilloscopeDisplay'
import { COMMON_ELECTRIC_FIELD_PRESETS, CUSTOM_PRESET_VALUE, derivePresetValue } from './presets'
import { buildDisplayTracePoints, buildDisplayTraceSegments } from './scopeTrace'
import { clampUnitDeflection } from './screenGeometry'
import { useOscilloscopeSimulation } from './useOscilloscopeSimulation'
import { RangeField } from '../../ui/controls/RangeField'
import { SelectField } from '../../ui/controls/SelectField'
import { TextField } from '../../ui/controls/TextField'
import { ControlSection } from '../../ui/controls/ControlSection'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import './oscilloscope.css'

const DISPLAY_FULL_SCALE_V = 10
/** 单步: 0.05 s, a tenth of the default 2 Hz signal's period. */
const STEP_S = 0.05

export function OscilloscopeScene() {
  const [timeRate, setTimeRate] = useState(() => recall('oscilloscope.timeRate', 1))
  const [xExpression, setXExpression] = useState(() => recall('oscilloscope.xExpression', '8*sawtooth(2*pi*2*t-pi)'))
  const [yExpression, setYExpression] = useState(() => recall('oscilloscope.yExpression', '6*sin(2*pi*2*t)'))
  useRemember('oscilloscope', { timeRate, xExpression, yExpression })

  // The trace is a pure function of the time cursor.
  const simulation = useOscilloscopeSimulation(timeRate, STEP_S)
  const timeCursor = simulation.timeS

  const compiledX = useMemo(() => compileVoltageExpression(xExpression), [xExpression])
  const compiledY = useMemo(() => compileVoltageExpression(yExpression), [yExpression])

  const ux = compiledX.evaluate(timeCursor)
  const uy = compiledY.evaluate(timeCursor)

  const rawBeamX = deriveDeflectionFromVoltage(ux, DISPLAY_FULL_SCALE_V)
  const rawBeamY = deriveDeflectionFromVoltage(uy, DISPLAY_FULL_SCALE_V)
  const radialClipped = Math.hypot(rawBeamX, rawBeamY) > 1 + 1e-9
  const [beamX, beamY] = clampUnitDeflection(rawBeamX, rawBeamY)
  const clippingReasons = [
    Math.abs(ux) > DISPLAY_FULL_SCALE_V + 1e-9 ? 'X 轴' : null,
    Math.abs(uy) > DISPLAY_FULL_SCALE_V + 1e-9 ? 'Y 轴' : null,
    radialClipped ? '圆屏合成偏转' : null,
  ].filter((reason): reason is string => reason !== null)

  // timeCursor advances every animation frame, so memoizing on it never hit; build directly.
  const trace = buildDisplayTracePoints({
    timeCursor,
    fullScaleV: DISPLAY_FULL_SCALE_V,
    evaluateX: compiledX.evaluate,
    evaluateY: compiledY.evaluate,
  })
  const traceSegments = buildDisplayTraceSegments(trace)
  const xPreset = useMemo(() => derivePresetValue(xExpression), [xExpression])
  const yPreset = useMemo(() => derivePresetValue(yExpression), [yExpression])
  const applyPreset = (axis: 'x' | 'y', value: string) => {
    if (value === CUSTOM_PRESET_VALUE) {
      return
    }

    if (axis === 'x') {
      setXExpression(value)
      return
    }
    setYExpression(value)
  }

  return (
    <SceneLayout
      controls={
        <div className="grid gap-[0.8rem]">
          <h2>示波器控制</h2>

          <ControlSection title="播放速度">
            <RangeField
              id="osc-time-rate"
              label="动画时间倍率"
              min={0.2}
              max={3}
              step={0.05}
              value={timeRate}
              onChange={setTimeRate}
              unit="×"
            />
          </ControlSection>

          <ControlSection title="X 偏转电压 Ux(t)">
            <SelectField
              id="osc-ux-preset"
              label="X 波形预设"
              className="preset-select"
              value={xPreset}
              onChange={(value) => applyPreset('x', value)}
              options={[
                { value: CUSTOM_PRESET_VALUE, label: '自定义（保留输入）' },
                ...COMMON_ELECTRIC_FIELD_PRESETS,
              ]}
            />
            <TextField
              id="osc-ux-expression"
              label="Ux(t) 函数"
              className="formula-input"
              value={xExpression}
              onChange={setXExpression}
              placeholder="例如: 5*sin(2*pi*50*t)"
            />
            {compiledX.error ? <p className="formula-error">{compiledX.error}</p> : null}
          </ControlSection>

          <ControlSection title="Y 偏转电压 Uy(t)">
            <SelectField
              id="osc-uy-preset"
              label="Y 波形预设"
              className="preset-select"
              value={yPreset}
              onChange={(value) => applyPreset('y', value)}
              options={[
                { value: CUSTOM_PRESET_VALUE, label: '自定义（保留输入）' },
                ...COMMON_ELECTRIC_FIELD_PRESETS,
              ]}
            />
            <TextField
              id="osc-uy-expression"
              label="Uy(t) 函数"
              className="formula-input"
              value={yExpression}
              onChange={setYExpression}
              placeholder="例如: 3*cos(2*pi*10*t)"
            />
            {compiledY.error ? <p className="formula-error">{compiledY.error}</p> : null}
          </ControlSection>

          <div className="formula-help scope-model-note">
            X/Y 偏转结构演示：X 轴使用“时基锯齿波”时，电子束从屏幕左侧匀速扫描并快速回扫；Y 轴输入显示为纵向变化。动画时间倍率只控制播放速度，不等同于 TIME/DIV；满偏固定为 ±10 V。管内轨迹以及电压到屏幕坐标的关系为线性示意，不是电子在偏转电场中的动力学计算；圆屏与二维轨迹都会按合成偏转半径限幅。
          </div>
          <div className="formula-help">
            Ux(t)、Uy(t) 的结果单位为 V，t 以 s 计；支持 + - * / ^、括号、pi/π、e 和 sin/cos/tan、asin/acos/atan、abs/sqrt/log/exp、floor/ceil/round、min/max、clamp、square/triangle/sawtooth。三角函数使用弧度。屏幕坐标归一化到 ±1（±1 为边缘）；超量程时光点限幅。
          </div>

        </div>
      }
      dataOverlay={
        <DataRows
          className="scope-telemetry"
          rows={[
            { label: '状态', value: simulation.clock.running ? '运行中' : '已暂停' },
            { label: '时刻', value: <>t = {timeCursor.toFixed(3)} s</> },
            { label: 'Ux / Uy', value: <>{ux.toFixed(2)} V / {uy.toFixed(2)} V</> },
            { label: '屏幕坐标（±1）', value: <>x={beamX >= 0 ? '+' : ''}{beamX.toFixed(2)}，y={beamY >= 0 ? '+' : ''}{beamY.toFixed(2)}</>, answer: true },
            {
              label: '满偏 ±10 V',
              value: clippingReasons.length ? `已限幅：${clippingReasons.join('、')}` : '未超量程',
              className: clippingReasons.length ? 'scope-overrange' : undefined,
            },
          ]}
        />
      }
      chart={
        <OscilloscopeDisplay
          beamX={beamX}
          beamY={beamY}
          traceSegments={traceSegments}
          running={simulation.clock.running}
        />
      }
      playbackActions={clockActions(simulation.clock, { stepLabel: '单步 0.05 s', onReset: simulation.reset })}
      chartVisible={true}
      chartInitiallyCollapsed
      viewport={
        <OscilloscopeCrt3D
          beamX={beamX}
          beamY={beamY}
          timeCursor={timeCursor}
          traceSegments={traceSegments}
          running={simulation.clock.running}
        />
      }
    />
  )
}

export default OscilloscopeScene
