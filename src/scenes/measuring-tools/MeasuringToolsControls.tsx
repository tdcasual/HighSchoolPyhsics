import { useState } from 'react'
import { ControlSection } from '../../ui/controls/ControlSection'
import { RangeField } from '../../ui/controls/RangeField'
import { SceneActions } from '../../ui/controls/SceneActions'
import { SegmentedControl } from '../../ui/controls/SegmentedControl'
import { TextField } from '../../ui/controls/TextField'
import { parseReading, type VernierDivisions } from './model'
import type { CaliperMeasure, ViewPreset } from './pose'
import type { MeasuringToolsSceneState } from './useMeasuringToolsSceneState'
import './measuring-tools.css'

const TOOLS = [
  { key: 'caliper', label: '游标卡尺' },
  { key: 'micrometer', label: '螺旋测微器' },
]
const LESSONS = [
  { key: 'free', label: '自由调节' },
  { key: 'read', label: '读数练习' },
  { key: 'adjust', label: '调节练习' },
]
const DIVISIONS = [
  { key: '10', label: '10 分度' },
  { key: '20', label: '20 分度' },
  { key: '50', label: '50 分度' },
]
const MEASURES = [
  { key: 'outer', label: '外径' },
  { key: 'inner', label: '内径' },
  { key: 'depth', label: '深度' },
]
const VIEWS = [
  { key: 'home', label: '全景' },
  { key: 'front', label: '正视' },
  { key: 'top', label: '俯视' },
  { key: 'focus', label: '刻度' },
]

export function MeasuringToolsControls({ state }: { state: MeasuringToolsSceneState }) {
  const [targetText, setTargetText] = useState('36.40')
  const locked = state.tool === 'caliper' ? state.caliperLocked : state.micLocked

  const applyTarget = () => {
    const parsed = parseReading(targetText)
    if (!parsed) {
      state.goTo(Number.NaN)
      return
    }
    state.goTo(parsed.value)
  }

  return (
    <div className="measure-controls">
      <h2>测量工具控制</h2>
      <ControlSection title="仪器">
        <SegmentedControl options={TOOLS} value={state.tool} onChange={(key) => state.setTool(key as 'caliper' | 'micrometer')} />
      </ControlSection>
      <ControlSection title="课堂模式">
        <SegmentedControl options={LESSONS} value={state.lesson} onChange={(key) => state.setLesson(key as 'free' | 'read' | 'adjust')} />
      </ControlSection>
      {state.tool === 'caliper' ? (
        <>
          <ControlSection title="分度">
            <SegmentedControl
              options={DIVISIONS}
              value={String(state.divisions)}
              onChange={(key) => state.setDivisions(Number(key) as VernierDivisions)}
            />
          </ControlSection>
          <ControlSection title="测量部位">
            <SegmentedControl options={MEASURES} value={state.measure} onChange={(key) => state.setMeasure(key as CaliperMeasure)} />
          </ControlSection>
          <ControlSection title="尺框位置">
            <RangeField
              id="caliper-x"
              label="尺框 x"
              min={0}
              max={150}
              step={0.01}
              value={state.caliperX}
              displayValue={`${state.caliperX.toFixed(2)} mm`}
              unit="mm"
              onChange={state.setCaliperX}
            />
          </ControlSection>
        </>
      ) : (
        <>
          <ControlSection title="测微螺杆">
            <RangeField
              id="mic-gap"
              label="间隙"
              min={0}
              max={25}
              step={0.001}
              value={state.micGap}
              displayValue={`${state.micGap.toFixed(3)} mm`}
              unit="mm"
              onChange={(value) => state.setMicGap(value, 'slider')}
            />
            <RangeField
              id="mic-zero"
              label="零点误差"
              min={-0.05}
              max={0.05}
              step={0.001}
              value={state.micZero}
              displayValue={`${state.micZero >= 0 ? '+' : ''}${state.micZero.toFixed(3)} mm`}
              unit="mm"
              onChange={state.setMicZero}
            />
          </ControlSection>
        </>
      )}
      <ControlSection title="观察视角">
        <SegmentedControl options={VIEWS} value={state.view} onChange={(key) => state.setView(key as ViewPreset)} />
      </ControlSection>
      <ControlSection title="调到指定读数">
        <TextField id="measure-target" label="目标示数" value={targetText} onChange={setTargetText} placeholder="例如 36.40" />
        <SceneActions actions={[{ key: 'goto', label: '调到该读数', onClick: applyTarget, disabled: locked }]} />
      </ControlSection>
      {state.lesson !== 'free' ? (
        <ControlSection title={state.lesson === 'read' ? '读数判定' : '调节检查'}>
          {state.lesson === 'read' ? (
            <TextField id="measure-answer" label="你的读数" value={state.answer} onChange={state.setAnswer} placeholder="mm" />
          ) : (
            <p className="measure-hint">目标 {state.target === null ? '尚未出题' : `${state.target.toFixed(state.tool === 'caliper' && state.divisions === 10 ? 1 : state.tool === 'caliper' ? 2 : 3)} mm`}</p>
          )}
          <SceneActions
            actions={[
              { key: 'ask', label: '出题', onClick: state.askQuestion },
              { key: 'check', label: state.lesson === 'read' ? '判定' : '检查', onClick: state.submit },
            ]}
          />
          {state.feedback ? <p className={state.feedbackOk ? 'measure-feedback ok' : 'measure-feedback bad'}>{state.feedback}</p> : null}
        </ControlSection>
      ) : (
        <ControlSection title="提示">
          <SceneActions actions={[{ key: 'hints', label: state.hints ? '隐藏分解' : '显示分解', onClick: () => state.setHints(!state.hints) }]} />
        </ControlSection>
      )}
      <p className="measure-hint">{state.notice}</p>
    </div>
  )
}
