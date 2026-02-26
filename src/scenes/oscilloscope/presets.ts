export type ElectricFieldPreset = {
  label: string
  value: string
}

export const CUSTOM_PRESET_VALUE = '__custom__'

export const COMMON_ELECTRIC_FIELD_PRESETS: ElectricFieldPreset[] = [
  { label: '无电场 (0V)', value: '0' },
  { label: '时基锯齿波', value: '8*sawtooth(2*pi*2*t)' },
  { label: '正弦波', value: '6*sin(2*pi*2*t)' },
  { label: '方波', value: '6*square(2*pi*2*t)' },
  { label: '三角波', value: '6*triangle(2*pi*2*t)' },
  { label: '高频正弦', value: '4*sin(2*pi*50*t)' },
]

export function derivePresetValue(expression: string): string {
  const matched = COMMON_ELECTRIC_FIELD_PRESETS.find((preset) => preset.value === expression)
  return matched ? matched.value : CUSTOM_PRESET_VALUE
}
