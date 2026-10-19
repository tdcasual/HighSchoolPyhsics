import { ModelNote } from '../../ui/notes/ModelNote'
import { RangeField } from '../../ui/controls/RangeField'
import { ControlSection } from '../../ui/controls/ControlSection'
import { SceneActions } from '../../ui/controls/SceneActions'
import { SegmentedControl } from '../../ui/controls/SegmentedControl'
import { formatScreenDistance, GRATING_ILLUMINATED_WIDTH_MM, getApertureRange, gratingIlluminatedSlitCount, gratingSlitWidth, gratingSpacing, type DiffractionMode, type FilterColor } from './model'
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
    | 'minScreenDistance'
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
    | 'reset'
  >
}

export function LightDiffractionControls({ state }: LightDiffractionControlsProps) {
  const apertureRange = getApertureRange(state.mode)
  const apertureLabel = state.mode === 'single-slit' ? '缝宽 a' : '孔径 D'

  return (
    <div className="grid gap-[0.8rem] content-start">
      <h2>衍射实验控制</h2>

      <ControlSection title="衍射模式">
        <SegmentedControl
          options={[
            { key: 'single-slit', label: '单缝' },
            { key: 'circular-aperture', label: '圆孔' },
            { key: 'circular-obstacle', label: '圆盘' },
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
        {!state.isWhiteLight && (
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
        )}
        {state.mode !== 'diffraction-grating' && (
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
        )}
        <RangeField
          id="diffraction-screen"
          label="缝屏距 L"
          unit="m"
          min={state.minScreenDistance}
          max={2.0}
          step={0.05}
          value={state.screenDistance}
          displayValue={formatScreenDistance(state.screenDistance)}
          onChange={state.setScreenDistance}
        />
        {state.mode === 'diffraction-grating' && (
          <>
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
            <p className="diffraction-parameter-note">
              光栅常数 d = {(gratingSpacing(state.gratingLines) * 1e6).toFixed(2)} μm；
              模型狭缝宽 a = {(gratingSlitWidth(state.gratingLines) * 1e6).toFixed(2)} μm（a = 0.2d）；
              照明宽度 {GRATING_ILLUMINATED_WIDTH_MM.toFixed(2)} mm，N = {gratingIlluminatedSlitCount(state.gratingLines)}
            </p>
          </>
        )}
        <ModelNote><p className="diffraction-parameter-note">
          单缝、圆孔和光栅使用夫琅禾费远场模型，自动保持 F=b²/(λL)≤0.1（b 为半缝宽、孔半径或受光宽的一半）；孔径或波长增大时会提高屏距下限。圆盘采用近轴近似。3D 尺寸、光栅槽纹和屏幕亮度均为示意。
        </p></ModelNote>
        {state.mode === 'circular-obstacle' && (
          <p className="diffraction-parameter-note">
            不透明圆盘采用近轴菲涅耳 / 巴比涅近似，显示轴上泊松亮斑与同心暗环。
          </p>
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
            label: state.showChart ? '隐藏分析图表' : '显示分析图表',
            onClick: state.toggleChart,
          },
          {
            key: 'reset',
            label: '重置',
            onClick: state.reset,
          },
        ]}
      />

      <ControlSection title="读数辅助">
        <RangeField
          id="eyepiece-angle"
          label="分划线旋角"
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
