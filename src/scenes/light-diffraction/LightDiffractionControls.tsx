import { RangeField } from '../../ui/controls/RangeField'
import { ControlSection } from '../../ui/controls/ControlSection'
import { SceneActions } from '../../ui/controls/SceneActions'
import { SegmentedControl } from '../../ui/controls/SegmentedControl'
import { getApertureRange, type DiffractionMode, type FilterColor } from './model'
import type { LightDiffractionSceneState } from './useLightDiffractionSceneState'

type LightDiffractionControlsProps = {
  state: Pick<
    LightDiffractionSceneState,
    | 'mode'
    | 'setMode'
    | 'wavelength'
    | 'setWavelength'
    | 'apertureSize'
    | 'setApertureSize'
    | 'screenDistance'
    | 'setScreenDistance'
    | 'gratingLines'
    | 'setGratingLines'
    | 'showChart'
    | 'toggleChart'
    | 'isLightOn'
    | 'toggleLight'
    | 'isWhiteLight'
    | 'toggleWhiteLight'
    | 'filterColor'
    | 'setFilterColor'
    | 'eyepieceAngle'
    | 'setEyepieceAngle'
  >
}

export function LightDiffractionControls({ state }: LightDiffractionControlsProps) {
  const apertureRange = getApertureRange(state.mode)
  const apertureLabel = state.mode === 'diffraction-grating' ? '光栅缝宽 a' : state.mode === 'single-slit' ? '缝宽 a' : '孔径 D'

  return (
    <div className="grid gap-[0.8rem] content-start">
      <h2>衍射实验控制</h2>

      <ControlSection title="衍射模式">
        <SegmentedControl
          options={[
            { key: 'single-slit', label: '单缝' },
            { key: 'circular-aperture', label: '圆孔' },
            { key: 'circular-obstacle', label: '圆球' },
            { key: 'diffraction-grating', label: '光栅' },
          ]}
          value={state.mode}
          onChange={(key) => state.setMode(key as DiffractionMode)}
        />
      </ControlSection>

      <ControlSection title="光源">
        <SegmentedControl
          options={[
            { key: 'mono', label: '单色光' },
            { key: 'white', label: '白光' },
          ]}
          value={state.isWhiteLight ? 'white' : 'mono'}
          onChange={() => state.toggleWhiteLight()}
        />
        {state.isWhiteLight && (
          <SegmentedControl
            options={[
              { key: 'none', label: '无滤光片' },
              { key: 'red', label: '红' },
              { key: 'green', label: '绿' },
              { key: 'blue', label: '蓝' },
            ]}
            value={state.filterColor}
            onChange={(key) => state.setFilterColor(key as FilterColor)}
          />
        )}
      </ControlSection>

      <ControlSection title="实验参数">
        <RangeField
          id="diffraction-wavelength"
          label="波长 λ"
          unit="nm"
          min={400}
          max={700}
          step={1}
          value={state.wavelength}
          onChange={state.setWavelength}
        />
        <RangeField
          id="diffraction-aperture"
          label={apertureLabel}
          unit="mm"
          min={apertureRange.min}
          max={apertureRange.max}
          step={apertureRange.step}
          value={state.apertureSize}
          onChange={state.setApertureSize}
        />
        <RangeField
          id="diffraction-screen"
          label="缝屏距 L"
          unit="m"
          min={0.5}
          max={2.0}
          step={0.05}
          value={state.screenDistance}
          onChange={state.setScreenDistance}
        />
        {state.mode === 'diffraction-grating' && (
          <RangeField
            id="diffraction-grating-lines"
            label="光栅线密度"
            unit="线/mm"
            min={100}
            max={600}
            step={10}
            value={state.gratingLines}
            onChange={state.setGratingLines}
          />
        )}
      </ControlSection>

      <SceneActions
        actions={[
          {
            key: 'toggle-light',
            label: state.isLightOn ? '关闭光源' : '打开光源',
            onClick: state.toggleLight,
          },
          {
            key: 'toggle-chart',
            label: state.showChart ? '隐藏图样' : '显示图样',
            onClick: state.toggleChart,
          },
        ]}
      />

      <ControlSection title="观察视角">
        <RangeField
          id="eyepiece-angle"
          label="目镜角度"
          unit="°"
          min={0}
          max={360}
          step={1}
          value={state.eyepieceAngle}
          onChange={state.setEyepieceAngle}
        />
      </ControlSection>
    </div>
  )
}
