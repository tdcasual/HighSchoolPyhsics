import { RangeField } from '../../ui/controls/RangeField'
import { ControlSection } from '../../ui/controls/ControlSection'
import { SceneActions } from '../../ui/controls/SceneActions'
import { SegmentedControl } from '../../ui/controls/SegmentedControl'
import type { FilterColor } from './model'
import type { DoubleSlitSceneState } from './useDoubleSlitSceneState'

type DoubleSlitControlsProps = {
  state: Pick<
    DoubleSlitSceneState,
    | 'wavelength'
    | 'setWavelength'
    | 'slitDistance'
    | 'setSlitDistance'
    | 'screenDistance'
    | 'setScreenDistance'
    | 'slitWidth'
    | 'setSlitWidth'
    | 'showChart'
    | 'toggleChart'
    | 'isLightOn'
    | 'toggleLight'
    | 'isWhiteLight'
    | 'toggleWhiteLight'
    | 'filterColor'
    | 'setFilterColor'
    | 'singleSlitAngle'
    | 'setSingleSlitAngle'
    | 'doubleSlitAngle'
    | 'setDoubleSlitAngle'
    | 'eyepieceAngle'
    | 'setEyepieceAngle'
  >
}

export function DoubleSlitControls({ state }: DoubleSlitControlsProps) {
  return (
    <div className="grid gap-[0.8rem] content-start">
      <h2>双缝干涉控制</h2>
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
          id="double-slit-wavelength"
          label="光源波长 λ"
          unit="nm"
          min={400}
          max={700}
          step={1}
          value={state.wavelength}
          onChange={state.setWavelength}
        />
        <RangeField
          id="double-slit-distance"
          label="双缝间距 d"
          unit="mm"
          min={0.1}
          max={0.5}
          step={0.01}
          value={state.slitDistance}
          onChange={state.setSlitDistance}
        />
        <RangeField
          id="double-slit-screen"
          label="双缝到屏距离 L"
          unit="m"
          min={0.5}
          max={1.5}
          step={0.05}
          value={state.screenDistance}
          onChange={state.setScreenDistance}
        />
        <RangeField
          id="double-slit-width"
          label="单缝宽度 a"
          unit="mm"
          min={0.01}
          max={0.10}
          step={0.005}
          value={state.slitWidth}
          onChange={state.setSlitWidth}
        />
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
            label: state.showChart ? '隐藏条纹图' : '显示条纹图',
            onClick: state.toggleChart,
          },
        ]}
      />
      <ControlSection title="组件旋转">
        <RangeField
          id="single-slit-angle"
          label="单缝角度"
          unit="°"
          min={0}
          max={360}
          step={1}
          value={state.singleSlitAngle}
          onChange={state.setSingleSlitAngle}
        />
        <RangeField
          id="double-slit-angle"
          label="双缝角度"
          unit="°"
          min={0}
          max={360}
          step={1}
          value={state.doubleSlitAngle}
          onChange={state.setDoubleSlitAngle}
        />
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
