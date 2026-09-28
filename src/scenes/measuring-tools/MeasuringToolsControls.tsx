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

function fixedZero(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(3)} mm`
}

export function MeasuringToolsControls({ state }: { state: MeasuringToolsSceneState }) {
  const [targetText, setTargetText] = useState('36.40')
  const locked = state.tool === 'caliper' ? state.caliperLocked : state.micLocked
  const checked = state.lastCheckAt !== null
  const precision = 1 / state.divisions
  const precisionText = precision.toFixed(state.divisions === 10 ? 1 : 2)

  const applyTarget = () => {
    const parsed = parseReading(targetText)
    if (!parsed) {
      state.goTo(Number.NaN)
      return
    }
    state.goTo(parsed.value)
  }

  const endChallenge = () => state.setLesson('free')
  const stepCaliper = (delta: number) => state.setCaliperX(state.caliperX + delta)
  const stepMicrometer = (delta: number) => state.setMicGap(state.micGap + delta, 'fine')

  return (
    <div className="measure-controls">
      <h2>测量工具控制</h2>

      <ControlSection title={state.challengeActive ? '当前练习' : '仪器与课堂模式'}>
        {state.challengeActive ? (
          <>
            <p className="measure-hint">
              {state.tool === 'caliper' ? `游标卡尺 · ${state.divisions} 分度 · ${state.measure === 'outer' ? '外径' : state.measure === 'inner' ? '内径' : '深度'}` : `螺旋测微器 · 零点误差 ${fixedZero(state.micZero)}`}
              {' · '}{state.lesson === 'read' ? '读数练习' : '调节练习'}
            </p>
            <SceneActions actions={[{ key: 'end', label: '结束本题并返回自由调节', onClick: endChallenge }]} />
          </>
        ) : (
          <>
            <SegmentedControl options={TOOLS} value={state.tool} onChange={(key) => state.setTool(key as 'caliper' | 'micrometer')} />
            <SegmentedControl options={LESSONS} value={state.lesson} onChange={(key) => state.setLesson(key as 'free' | 'read' | 'adjust')} />
          </>
        )}
      </ControlSection>

      {!state.challengeActive && state.tool === 'caliper' ? (
        <>
          <ControlSection title="分度与测量部位">
            <SegmentedControl
              options={DIVISIONS}
              value={String(state.divisions)}
              onChange={(key) => state.setDivisions(Number(key) as VernierDivisions)}
            />
            <SegmentedControl options={MEASURES} value={state.measure} onChange={(key) => state.setMeasure(key as CaliperMeasure)} />
          </ControlSection>
          {state.lesson === 'free' ? (
            <ControlSection title="自由调节位置">
              <RangeField
                id="caliper-x"
                label="尺框位置"
                min={0}
                max={150}
                step={0.01}
                value={state.caliperX}
                displayValue={`${state.caliperX.toFixed(2)} mm`}
                unit="mm"
                onChange={state.setCaliperX}
              />
            </ControlSection>
          ) : null}
        </>
      ) : null}

      {!state.challengeActive && state.tool === 'micrometer' ? (
        state.lesson === 'free' ? (
          <ControlSection title="自由调节与零点设置">
            <RangeField
              id="mic-gap"
              label="螺杆间隙"
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
              displayValue={fixedZero(state.micZero)}
              unit="mm"
              onChange={state.setMicZero}
            />
            <p className="measure-hint">示数 = 实际长度 + 零点误差；校正后长度 = 示数 − 零点误差。</p>
          </ControlSection>
        ) : (
          <ControlSection title="零点信息">
            <p className="measure-hint">练习中零点误差固定为 {fixedZero(state.micZero)}。示数 = 实际长度 + 零点误差；校正后长度 = 示数 − 零点误差。</p>
          </ControlSection>
        )
      ) : null}

      <ControlSection title="观察视角">
        <SegmentedControl options={VIEWS} value={state.view} onChange={(key) => state.setView(key as ViewPreset)} />
        <SceneActions
          actions={[
            {
              key: "labels",
              label: state.showLabels ? "隐藏部件名称" : "显示部件名称",
              onClick: () => state.setShowLabels(!state.showLabels),
            },
          ]}
        />
      </ControlSection>

      {state.lesson === 'free' ? (
        <>
          <ControlSection title="调到指定读数">
            <TextField id="measure-target" label="目标示数" value={targetText} onChange={setTargetText} placeholder="例如 36.40" />
            <SceneActions actions={[{ key: 'goto', label: '调到该读数', onClick: applyTarget, disabled: locked }]} />
          </ControlSection>
          <ControlSection title="提示">
            <SceneActions actions={[{ key: 'hints', label: state.hints ? '隐藏分解' : '显示分解', onClick: () => state.setHints(!state.hints) }]} />
          </ControlSection>
        </>
      ) : (
        <ControlSection title={state.lesson === 'read' ? '读数判定' : '调节练习'}>
          {state.lesson === 'read' ? (
            <>
              {state.tool === 'micrometer' ? <p className="measure-hint">读出仪器示数；校正后的实际长度 = 示数 − ({fixedZero(state.micZero)})。</p> : null}
              {state.challengeActive && checked ? (
              <p className="measure-hint">你提交的读数：{state.answer || '（空）'}</p>
            ) : (
              <TextField
                id="measure-answer"
                label="你的读数"
                value={state.answer}
                onChange={state.setAnswer}
                placeholder="输入读数（mm）"
              />
              )}
            </>
          ) : state.target === null ? (
            <p className="measure-hint">出题后按目标读数调节仪器；当前位置数值会在判定后显示。</p>
          ) : (
            <>
              <p className="measure-hint">
                目标示数：{state.target.toFixed(state.tool === 'caliper' ? (state.divisions === 10 ? 1 : 2) : 3)} mm
                {checked ? ' · 本题已判定' : ' · 拖动仪器或用下方步进按钮调节'}
              </p>
              {state.challengeActive && !checked ? (
                <SceneActions
                  actions={state.tool === 'caliper'
                    ? [
                        { key: 'caliper-coarse-down', label: '−1 mm', onClick: () => stepCaliper(-1), disabled: locked },
                        { key: 'caliper-fine-down', label: `−${precisionText} mm`, onClick: () => stepCaliper(-precision), disabled: locked },
                        { key: 'caliper-fine-up', label: `+${precisionText} mm`, onClick: () => stepCaliper(precision), disabled: locked },
                        { key: 'caliper-coarse-up', label: '+1 mm', onClick: () => stepCaliper(1), disabled: locked },
                      ]
                    : [
                        { key: 'mic-coarse-down', label: '−0.1 mm', onClick: () => stepMicrometer(-0.1), disabled: locked },
                        { key: 'mic-fine-down', label: '−0.001 mm', onClick: () => stepMicrometer(-0.001), disabled: locked },
                        { key: 'mic-fine-up', label: '+0.001 mm', onClick: () => stepMicrometer(0.001), disabled: locked },
                        { key: 'mic-coarse-up', label: '+0.1 mm', onClick: () => stepMicrometer(0.1), disabled: locked },
                      ]}
                />
              ) : null}
            </>
          )}
          <SceneActions
            actions={[
              { key: 'ask', label: state.challengeActive ? '换一题' : '出题', onClick: state.askQuestion },
              { key: 'check', label: state.lesson === 'read' ? '判定' : '检查', onClick: state.submit, disabled: !state.challengeActive || checked },
            ]}
          />
          {state.feedback ? <p className={state.feedbackOk ? 'measure-feedback ok' : 'measure-feedback bad'}>{state.feedback}</p> : null}
        </ControlSection>
      )}

      <p className="measure-hint">{state.notice}</p>
    </div>
  )
}
