import { RangeField } from '../../ui/controls/RangeField'
import { ControlSection } from '../../ui/controls/ControlSection'
import { SceneActions } from '../../ui/controls/SceneActions'
import { SegmentedControl } from '../../ui/controls/SegmentedControl'
import type { DoubleSlitSceneState } from './useDoubleSlitSceneState'
import { LightSourceSection } from '../../domains/optics/LightSourceSection'

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
    | 'isBlindMode'
    | 'setBlindMode'
    | 'wheelReadoutMm'
    | 'setWheelReadoutMm'
    | 'stepWheel'
    | 'fringeCount'
    | 'setFringeCount'
    | 'firstReadingMm'
    | 'secondReadingMm'
    | 'recordFirstReading'
    | 'recordSecondReading'
    | 'calculateMeasuredWavelength'
    | 'clearMeasurements'
    | 'showFringeOrders'
    | 'toggleFringeOrders'
    | 'reset'
  >
}

export function DoubleSlitControls({ state }: DoubleSlitControlsProps) {
  const canCalculate =
    state.firstReadingMm !== null &&
    state.secondReadingMm !== null &&
    state.firstReadingMm !== state.secondReadingMm &&
    state.fringeCount >= 2 &&
    !state.isWhiteLight

  return (
    <div className="grid gap-[0.8rem] content-start">
      <h2>双缝干涉控制</h2>
      <LightSourceSection
        isWhiteLight={state.isWhiteLight}
        onToggleWhiteLight={state.toggleWhiteLight}
        filterColor={state.filterColor}
        onFilterChange={state.setFilterColor}
      />
      <ControlSection title="实验参数">
        {!state.isWhiteLight && !state.isBlindMode && (
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
        )}
        {state.isBlindMode && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            未知单色光已隐藏波长；教师可先选波长，再开启测量练习。
          </p>
        )}
        {state.isWhiteLight && (
          <p className="text-xs text-slate-500 dark:text-slate-400">白光模式下不显示单一波长滑杆。</p>
        )}
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
          max={0.1}
          step={0.005}
          value={state.slitWidth}
          onChange={state.setSlitWidth}
        />
      </ControlSection>
      <ControlSection title="测量头与读数">
        {!state.isWhiteLight ? (
          <SegmentedControl
            options={[
              { key: 'known', label: '已知 λ' },
              { key: 'blind', label: '隐藏 λ 练习' },
            ]}
            value={state.isBlindMode ? 'blind' : 'known'}
            onChange={(key) => state.setBlindMode(key === 'blind')}
          />
        ) : (
          <p className="text-xs text-amber-700 dark:text-amber-300">白光包含多个波长，请切换单色光后再反算 λ。</p>
        )}
        <RangeField
          id="double-slit-wheel"
          transient
          label="测量头读数 a"
          unit="mm"
          min={0}
          max={25}
          step={0.001}
          value={state.wheelReadoutMm}
          onChange={state.setWheelReadoutMm}
        />
        <SceneActions
          layout="grid-2"
          actions={[
            { key: 'back-half', label: '◀ 半圈', onClick: () => state.stepWheel(-0.25) },
            { key: 'back-step', label: '◀ 一格', onClick: () => state.stepWheel(-0.01) },
            { key: 'forward-step', label: '一格 ▶', onClick: () => state.stepWheel(0.01) },
            { key: 'forward-half', label: '半圈 ▶', onClick: () => state.stepWheel(0.25) },
          ]}
        />
        <RangeField
          id="double-slit-fringe-count"
          label="两次读数间亮纹条数 n"
          min={2}
          max={11}
          step={1}
          value={state.fringeCount}
          onChange={state.setFringeCount}
        />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          a₁：{state.firstReadingMm === null ? '未记录' : state.firstReadingMm.toFixed(3) + ' mm'}；a₂：
          {state.secondReadingMm === null ? '未记录' : state.secondReadingMm.toFixed(3) + ' mm'}
        </p>
        <SceneActions
          layout="grid-2"
          actions={[
            { key: 'record-a1', label: '记为 a₁', onClick: state.recordFirstReading },
            { key: 'record-a2', label: '记为 a₂', onClick: state.recordSecondReading },
            {
              key: 'calculate',
              label: '计算 Δx 与 λ',
              onClick: state.calculateMeasuredWavelength,
              disabled: !canCalculate,
            },
            { key: 'clear', label: '清空读数', onClick: state.clearMeasurements },
          ]}
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
          {
            key: 'toggle-orders',
            label: state.showFringeOrders ? '隐藏亮纹序号' : '显示亮纹序号',
            onClick: state.toggleFringeOrders,
            disabled: state.isWhiteLight,
          },
          {
            key: 'reset',
            label: '重置',
            onClick: state.reset,
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
          label="分划板角度"
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
