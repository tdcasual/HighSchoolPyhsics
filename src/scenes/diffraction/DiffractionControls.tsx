import { LightSourceSection } from '../../domains/optics/LightSourceSection'
import { ControlSection } from '../../ui/controls/ControlSection'
import { ModelNote } from '../../ui/notes/ModelNote'
import {
  MODE_LABEL,
  gratingSlitWidth,
  formatScreenDistance,
  gratingSpacing,
  gratingIlluminatedSlitCount,
  GRATING_ILLUMINATED_WIDTH_MM,
  getApertureRange,
  type DiffractionMode,
} from '../../domains/optics/diffraction'
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

function getApertureLabel(mode: DiffractionMode): string {
  switch (mode) {
    case 'single-slit':
      return '缝宽 a'
    case 'circular-aperture':
      return '孔径 D'
    case 'circular-obstacle':
      return '圆盘直径 D'
    case 'diffraction-grating':
      return '缝宽 a'
  }
}

export function DiffractionControls({ state }: { state: DiffractionSceneState }) {
  const { mode, params, isWhiteLight } = state
  const apertureRange = getApertureRange(mode)

  const actions = [
    { key: 'toggle-light', label: state.isLightOn ? '关闭光源' : '打开光源', onClick: state.toggleLight },
    { key: 'toggle-pattern', label: state.showPattern ? '隐藏图样' : '显示图样', onClick: state.togglePattern },
    { key: 'toggle-profile', label: state.showProfile ? '隐藏曲线' : '显示曲线', onClick: state.toggleProfile },
    { key: 'reset', label: '重置', onClick: state.reset },
  ]

  return (
    <div className="grid gap-[0.8rem] content-start">
      <h2>衍射演示控制</h2>
      <ControlSection title="衍射模式">
        <SegmentedControl
          options={MODE_OPTIONS}
          value={mode}
          onChange={(key) => state.setMode(key as DiffractionMode)}
        />
      </ControlSection>

      <LightSourceSection
        isWhiteLight={isWhiteLight}
        onToggleWhiteLight={state.toggleWhiteLight}
        filterColor={state.filterColor}
        onFilterChange={state.setFilterColor}
      />

      <ControlSection title="实验参数">
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
        {mode !== 'diffraction-grating' && (
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
        )}
        <RangeField
          id="screen-distance"
          label="屏距 L"
          value={params.screenDistance}
          displayValue={formatScreenDistance(params.screenDistance)}
          min={state.minScreenDistance}
          max={3.0}
          step={0.1}
          unit="m"
          onChange={state.setScreenDistance}
        />
        {mode === 'diffraction-grating' && (
          <>
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
            <p className="text-xs opacity-80 leading-snug">
              光栅常数 d = {(gratingSpacing(params.gratingLines) * 1e6).toFixed(2)} μm； 狭缝宽 a ={' '}
              {(gratingSlitWidth(params.gratingLines) * 1e6).toFixed(2)} μm。
              三维光栅为放大示意，屏幕图样按实际线密度计算。
              <br />
              有效照明宽度 {GRATING_ILLUMINATED_WIDTH_MM.toFixed(2)} mm，N ={' '}
              {gratingIlluminatedSlitCount(params.gratingLines)}。
            </p>
          </>
        )}
      </ControlSection>

      <ControlSection title="显示">
        <SceneActions actions={actions.slice(0, 2)} />
        <SceneActions actions={actions.slice(2)} />
      </ControlSection>

      <ModelNote>
        <p>
          单缝、圆孔和光栅按夫琅禾费远场模型，自动保持 F=b²/(λL)≤0.1（b
          为半缝宽、孔半径或受光宽的一半）；孔径或波长增大时会提高屏距下限。圆盘按近轴泊松亮斑近似。屏幕视场随参数调整，三维几何按观察需要放大。
        </p>
        {mode === 'circular-obstacle' && (
          <p>圆盘屏幕图样采用近轴菲涅耳 / 巴比涅 J₀² 近似，显示轴上泊松亮斑与第一暗环；不等同完整有限距离积分。</p>
        )}
      </ModelNote>
    </div>
  )
}
