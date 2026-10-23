import { ControlSection } from '../../ui/controls/ControlSection'
import { RangeField } from '../../ui/controls/RangeField'
import { SelectField } from '../../ui/controls/SelectField'
import { TextField } from '../../ui/controls/TextField'
import { COMMON_ELECTRIC_FIELD_PRESETS, CUSTOM_PRESET_VALUE } from './presets'
import type { OscilloscopeSceneState } from './useOscilloscopeSceneState'

export function OscilloscopeControls({ state }: { state: OscilloscopeSceneState }) {
  return (
    <div className="grid gap-[0.8rem]">
      <h2>示波器控制</h2>

      <ControlSection title="播放速度">
        <RangeField
          id="osc-time-rate"
          label="动画时间倍率"
          min={0.2}
          max={3}
          step={0.05}
          value={state.timeRate}
          onChange={state.setTimeRate}
          unit="×"
        />
      </ControlSection>

      <ControlSection title="X 偏转电压 Ux(t)">
        <SelectField
          id="osc-ux-preset"
          label="X 波形预设"
          className="preset-select"
          value={state.xPreset}
          onChange={(value) => state.applyPreset('x', value)}
          options={[{ value: CUSTOM_PRESET_VALUE, label: '自定义（保留输入）' }, ...COMMON_ELECTRIC_FIELD_PRESETS]}
        />
        <TextField
          id="osc-ux-expression"
          label="Ux(t) 函数"
          className="formula-input"
          value={state.xExpression}
          onChange={state.setXExpression}
          placeholder="例如: 5*sin(2*pi*50*t)"
        />
        {state.xError ? <p className="formula-error">{state.xError}</p> : null}
      </ControlSection>

      <ControlSection title="Y 偏转电压 Uy(t)">
        <SelectField
          id="osc-uy-preset"
          label="Y 波形预设"
          className="preset-select"
          value={state.yPreset}
          onChange={(value) => state.applyPreset('y', value)}
          options={[{ value: CUSTOM_PRESET_VALUE, label: '自定义（保留输入）' }, ...COMMON_ELECTRIC_FIELD_PRESETS]}
        />
        <TextField
          id="osc-uy-expression"
          label="Uy(t) 函数"
          className="formula-input"
          value={state.yExpression}
          onChange={state.setYExpression}
          placeholder="例如: 3*cos(2*pi*10*t)"
        />
        {state.yError ? <p className="formula-error">{state.yError}</p> : null}
      </ControlSection>

      <div className="formula-help scope-model-note">
        X/Y 偏转结构演示：X 轴使用“时基锯齿波”时，电子束从屏幕左侧匀速扫描并快速回扫；Y
        轴输入显示为纵向变化。动画时间倍率只控制播放速度，不等同于 TIME/DIV；满偏固定为 ±10
        V。管内轨迹以及电压到屏幕坐标的关系为线性示意，不是电子在偏转电场中的动力学计算；圆屏与二维轨迹都会按合成偏转半径限幅。
      </div>
      <div className="formula-help">
        Ux(t)、Uy(t) 的结果单位为 V，t 以 s 计；支持 + - * / ^、括号、pi/π、e 和
        sin/cos/tan、asin/acos/atan、abs/sqrt/log/exp、floor/ceil/round、min/max、clamp、square/triangle/sawtooth。三角函数使用弧度。屏幕坐标归一化到
        ±1（±1 为边缘）；超量程时光点限幅。
      </div>
    </div>
  )
}
