import type { ThemeMode } from '../../store/useAppStore'

export type AlternatorPalette = {
  background: string
  label: string
  field: string
  axis: string
  fillLight: string
  magnetNorth: string
  magnetSouth: string
  wireOrange: string
  wireBlue: string
  ringOrange: string
  ringBlue: string
  brush: string
  circuit: string
  resistor: string
  meterCasing: string
  meterBorder: string
  meterNeedle: string
}

const DAY_PALETTE: AlternatorPalette = {
  background: '#f5f2ed',
  label: '#22313f',
  field: '#a0b8cc',
  axis: '#8ca0b4',
  fillLight: '#a8c4dc',
  magnetNorth: '#FF7043',
  magnetSouth: '#29B6F6',
  wireOrange: '#FF7043',
  wireBlue: '#29B6F6',
  ringOrange: '#FF9A76',
  ringBlue: '#4FC3F7',
  brush: '#555555',
  circuit: '#999999',
  resistor: '#d8d8d8',
  meterCasing: '#f5f5f5',
  meterBorder: '#555555',
  meterNeedle: '#ff4444',
}

const NIGHT_PALETTE: AlternatorPalette = {
  background: '#1e2430',
  label: '#ffffff',
  field: '#f2f8ff',
  axis: '#eef6ff',
  fillLight: '#a8c4dc',
  magnetNorth: '#FF8A65',
  magnetSouth: '#4FC3F7',
  wireOrange: '#ffffff',
  wireBlue: '#ffffff',
  ringOrange: '#FFB74D',
  ringBlue: '#81D4FA',
  brush: '#888888',
  circuit: '#ffffff',
  resistor: '#e8e8e8',
  meterCasing: '#ffffff',
  meterBorder: '#cccccc',
  meterNeedle: '#ff6666',
}

export function getAlternatorPalette(theme: ThemeMode): AlternatorPalette {
  return theme === 'night' ? NIGHT_PALETTE : DAY_PALETTE
}
