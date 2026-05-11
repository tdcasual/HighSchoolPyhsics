import {
  MODE_LABEL,
  FILTER_LABEL,
  type DiffractionMode,
  type FilterColor,
} from '../light-diffraction/model'
import type { DiffractionSceneState } from './useDiffractionSceneState'
import { SceneActions } from '../../ui/controls/SceneActions'
import { SegmentedControl } from '../../ui/controls/SegmentedControl'
import { RangeField } from '../../ui/controls/RangeField'

const MODE_OPTIONS: Array<{ key: DiffractionMode; label: string }> = [
  { key: 'single-slit', label: MODE_LABEL['single-slit'] },
  { key: 'circular-aperture', label: MODE_LABEL['circular-aperture'] },
  { key: 'circular-obstacle', label: MODE_LABEL['circular-obstacle'] },
  { key: 'diffraction-grating', label: MODE_LABEL['diffraction-grating'] },
]

const FILTER_OPTIONS: Array<{ key: FilterColor; label: string }> = [
  { key: 'none', label: '无' },
  { key: 'red', label: FILTER_LABEL.red },
  { key: 'green', label: FILTER_LABEL.green },
  { key: 'blue', label: FILTER_LABEL.blue },
]

function getApertureLabel(mode: DiffractionMode): string {
  switch (mode) {
    case 'single-slit': return '缝宽 a'
    case 'circular-aperture': return '孔径 D'
    case 'circular-obstacle': return '球径 D'
    case 'diffraction-grating': return '缝宽 a'
  }
}

function getApertureRange(mode: DiffractionMode): { min: number; max: number; step: number } {
  switch (mode) {
    case 'single-slit': return { min: 0.02, max: 0.50, step: 0.01 }
    case 'circular-aperture': return { min: 0.05, max: 2.00, step: 0.05 }
    case 'circular-obstacle': return { min: 0.05, max: 2.00, step: 0.05 }
    case 'diffraction-grating': return { min: 0.02, max: 0.50, step: 0.01 }
  }
}

export function DiffractionControls({ state }: { state: DiffractionSceneState }) {
  const { mode, params, isWhiteLight } = state
  const apertureRange = getApertureRange(mode)

  const actions = [
    { key: 'toggle-light', label: state.isLightOn ? '关闭光源' : '打开光源', onClick: state.toggleLight },
    { key: 'toggle-white', label: isWhiteLight ? '单色光' : '白光', onClick: state.toggleWhiteLight },
    { key: 'toggle-chart', label: state.showChart ? '隐藏图样' : '显示图样', onClick: state.toggleChart },
    { key: 'toggle-profile', label: state.showProfile ? '隐藏曲线' : '显示曲线', onClick: state.toggleProfile },
    { key: 'reset', label: '重置', onClick: state.reset },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium mb-1.5">衍射模式</label>
        <SegmentedControl
          options={MODE_OPTIONS}
          value={mode}
          onChange={(key) => state.setMode(key as DiffractionMode)}
        />
      </div>

      {!isWhiteLight && (
        <RangeField
          id="wavelength"
          label="波长 λ"
          value={params.wavelength}
          min={400}
          max={700}
          step={1}
          unit="nm"
          onChange={state.setWavelength}
        />
      )}

      {isWhiteLight && (
        <div>
          <label className="block text-sm font-medium mb-1.5">滤光片</label>
          <SegmentedControl
            options={FILTER_OPTIONS}
            value={state.filterColor}
            onChange={(key) => state.setFilterColor(key as FilterColor)}
          />
        </div>
      )}

      <RangeField
        id="aperture-size"
        label={getApertureLabel(mode)}
        value={params.apertureSize}
        min={apertureRange.min}
        max={apertureRange.max}
        step={apertureRange.step}
        unit="mm"
        onChange={state.setApertureSize}
      />

      <RangeField
        id="screen-distance"
        label="屏距 L"
        value={params.screenDistance}
        min={0.5}
        max={3.0}
        step={0.1}
        unit="m"
        onChange={state.setScreenDistance}
      />

      {mode === 'diffraction-grating' && (
        <RangeField
          id="grating-lines"
          label="光栅线密度"
          value={params.gratingLines}
          min={100}
          max={600}
          step={10}
          unit="条/mm"
          onChange={state.setGratingLines}
        />
      )}

      <SceneActions actions={actions} />
    </div>
  )
}
