import { useMemo, useState } from 'react'
import { deriveDeflectionFromVoltage, deriveTimeCursor } from './runtime'
import { compileVoltageExpression } from './expression'
import { OscilloscopeCrt3D } from './OscilloscopeCrt3D'
import { OscilloscopeDisplay } from './OscilloscopeDisplay'
import { COMMON_ELECTRIC_FIELD_PRESETS, CUSTOM_PRESET_VALUE, derivePresetValue } from './presets'
import { buildDisplayTracePoints, buildDisplayTraceSegments } from './scopeTrace'
import { useOscilloscopeSimulation } from './useOscilloscopeSimulation'
import { SceneActions } from '../../ui/controls/SceneActions'
import { RangeField } from '../../ui/controls/RangeField'
import { SelectField } from '../../ui/controls/SelectField'
import { TextField } from '../../ui/controls/TextField'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import './oscilloscope.css'

const DISPLAY_FULL_SCALE_V = 10

export function OscilloscopeScene() {
  const [initialSpeed, setInitialSpeed] = useState(1)
  const [xExpression, setXExpression] = useState('0')
  const [yExpression, setYExpression] = useState('0')

  const simulation = useOscilloscopeSimulation(1 / 240, initialSpeed)
  const timeCursor = deriveTimeCursor(simulation.state)

  const compiledX = useMemo(() => compileVoltageExpression(xExpression), [xExpression])
  const compiledY = useMemo(() => compileVoltageExpression(yExpression), [yExpression])

  const ux = compiledX.evaluate(timeCursor)
  const uy = compiledY.evaluate(timeCursor)

  const beamX = deriveDeflectionFromVoltage(ux, DISPLAY_FULL_SCALE_V)
  const beamY = deriveDeflectionFromVoltage(uy, DISPLAY_FULL_SCALE_V)

  const trace = useMemo<Array<[number, number]>>(() => {
    return buildDisplayTracePoints({
      timeCursor,
      fullScaleV: DISPLAY_FULL_SCALE_V,
      evaluateX: compiledX.evaluate,
      evaluateY: compiledY.evaluate,
    })
  }, [compiledX, compiledY, timeCursor])
  const traceSegments = useMemo(() => buildDisplayTraceSegments(trace), [trace])
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
        <>
        <h2>示波器控制</h2>

        <RangeField
          id="osc-speed"
          label="初始速度"
          min={0.2}
          max={3}
          step={0.05}
          value={initialSpeed}
          onChange={setInitialSpeed}
        />

        <div className="subsection">
          <h3>X 电场 Ux(t)</h3>
          <SelectField
            id="osc-ux-preset"
            label="X 常用函数"
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
        </div>

        <div className="subsection">
          <h3>Y 电场 Uy(t)</h3>
          <SelectField
            id="osc-uy-preset"
            label="Y 常用函数"
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
        </div>

        <div className="formula-help">
          支持: + - * / ^, 括号, t, pi, sin/cos/tan, abs/sqrt, min/max, clamp
        </div>

        <SceneActions
          actions={[
            {
              key: 'toggle-running',
              label: simulation.running ? '暂停' : '播放',
              onClick: simulation.toggleRunning,
            },
            {
              key: 'reset',
              label: '重置',
              onClick: simulation.reset,
            },
          ]}
        />

        <OscilloscopeDisplay
          beamX={beamX}
          beamY={beamY}
          traceSegments={traceSegments}
          running={simulation.running}
        />

        {simulation.error ? <p className="formula-error">仿真错误: {simulation.error}</p> : null}

        <div className="structure-card">
          <h3>结构组成</h3>
          <ul>
            <li>电子枪</li>
            <li>Y 偏转板</li>
            <li>X 偏转板</li>
            <li>荧光屏</li>
          </ul>
        </div>
      </>
      }
      viewport={
        <OscilloscopeCrt3D
          beamX={beamX}
          beamY={beamY}
          timeCursor={timeCursor}
          running={simulation.running}
        />
      }
    />
  )
}
