import { useState, type ReactNode } from 'react'
import { ControlSection } from '../../ui/controls/ControlSection'
import { SceneActions } from '../../ui/controls/SceneActions'
import { SegmentedControl } from '../../ui/controls/SegmentedControl'
import { TextField } from '../../ui/controls/TextField'
import { parseReading } from './model'
import type { ViewPreset } from './pose'
import type { LessonMode, PracticeState } from './practice'
import './measuring.css'

/** Sidebar sections shared by the vernier-caliper and micrometer scenes. */

const LESSONS = [
  { key: 'free', label: '自由调节' },
  { key: 'read', label: '读数练习' },
  { key: 'adjust', label: '调节练习' },
]

const VIEWS = [
  { key: 'home', label: '全景' },
  { key: 'front', label: '正视' },
  { key: 'top', label: '俯视' },
  { key: 'focus', label: '刻度' },
]

export function LessonSection({ state, summary, onLesson }: {
  state: PracticeState
  /** One line describing the current question's set-up (shown while a question runs). */
  summary: string
  onLesson: (lesson: LessonMode) => void
}) {
  return (
    <ControlSection title={state.challengeActive ? '当前练习' : '课堂模式'}>
      {state.challengeActive ? (
        <>
          <p className="measure-hint">{summary} · {state.lesson === 'read' ? '读数练习' : '调节练习'}</p>
          <SceneActions actions={[{ key: 'end', label: '结束本题并返回自由调节', onClick: () => onLesson('free') }]} />
        </>
      ) : (
        <SegmentedControl options={LESSONS} value={state.lesson} onChange={(key) => onLesson(key as LessonMode)} />
      )}
    </ControlSection>
  )
}

export function StepButtons({ hint, actions }: { hint: string; actions: { key: string; label: string; onClick: () => void; disabled?: boolean }[] }) {
  return (
    <>
      <p className="measure-hint">{hint}</p>
      <div className="measure-steps">
        <SceneActions actions={actions} />
      </div>
    </>
  )
}

export function ViewSection({ state, onView, onLabels, onFreeWork }: {
  state: PracticeState
  onView: (view: ViewPreset) => void
  onLabels: (show: boolean) => void
  onFreeWork: (show: boolean) => void
}) {
  return (
    <ControlSection title="观察视角">
      <SegmentedControl options={VIEWS} value={state.view} onChange={(key) => onView(key as ViewPreset)} />
      <SceneActions
        actions={[
          { key: 'labels', label: state.showLabels ? '隐藏部件名称' : '显示部件名称', onClick: () => onLabels(!state.showLabels) },
          ...(state.lesson === 'free'
            ? [{ key: 'work', label: state.freeWork ? '隐藏工件' : '显示工件', onClick: () => onFreeWork(!state.freeWork) }]
            : []),
        ]}
      />
    </ControlSection>
  )
}

/** 自由调节: type a reading and the instrument eases to it; plus the 分解 toggle. */
export function TargetSection({ state, label, example, onGoTo, onHints }: {
  state: PracticeState
  label: string
  example: string
  onGoTo: (value: number) => void
  onHints: (hints: boolean) => void
}) {
  const [text, setText] = useState(example)
  return (
    <>
      <ControlSection title="调到指定读数">
        <TextField id="measure-target" label={label} value={text} onChange={setText} placeholder={`例如 ${example}`} />
        <SceneActions
          actions={[{
            key: 'goto',
            label: '调到该读数',
            onClick: () => onGoTo(parseReading(text)?.value ?? Number.NaN),
            disabled: state.locked,
          }]}
        />
      </ControlSection>
      <ControlSection title="提示">
        <SceneActions actions={[{ key: 'hints', label: state.hints ? '隐藏分解' : '显示分解', onClick: () => onHints(!state.hints) }]} />
      </ControlSection>
    </>
  )
}

/** Reading and adjustment practice: the answer box or target, 出题 / 判定, and feedback. */
export function JudgeSection({ state, targetText, readHint, stepButtons, onAnswer, onAsk, onSubmit }: {
  state: PracticeState
  /** The adjustment target formatted to the instrument's precision. */
  targetText: string | null
  readHint?: ReactNode
  stepButtons: ReactNode
  onAnswer: (answer: string) => void
  onAsk: () => void
  onSubmit: () => void
}) {
  const checked = state.lastCheckAt !== null
  return (
    <ControlSection title={state.lesson === 'read' ? '读数判定' : '调节练习'}>
      {state.lesson === 'read' ? (
        <>
          {readHint}
          {state.challengeActive && checked ? (
            <p className="measure-hint">你提交的读数：{state.answer || '（空）'}</p>
          ) : (
            <TextField id="measure-answer" label="你的读数" value={state.answer} onChange={onAnswer} placeholder="输入读数（mm）" />
          )}
        </>
      ) : targetText === null ? (
        <p className="measure-hint">出题后按目标读数调节仪器；当前位置数值会在判定后显示。</p>
      ) : (
        <>
          <p className="measure-hint">
            目标示数：{targetText} mm{checked ? ' · 本题已判定' : ' · 拖动仪器或用步进按钮调节，读数看图表'}
          </p>
          {state.challengeActive && !checked ? stepButtons : null}
        </>
      )}
      <SceneActions
        actions={[
          { key: 'ask', label: state.challengeActive ? '换一题' : '出题', onClick: onAsk },
          { key: 'check', label: state.lesson === 'read' ? '判定' : '检查', onClick: onSubmit, disabled: !state.challengeActive || checked },
        ]}
      />
      {state.feedback ? <p className={state.feedbackOk ? 'measure-feedback ok' : 'measure-feedback bad'}>{state.feedback}</p> : null}
    </ControlSection>
  )
}
