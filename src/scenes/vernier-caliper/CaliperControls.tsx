import { caliperReading, type VernierDivisions } from '../../instruments/measuring/model'
import type { CaliperMeasure } from '../../instruments/measuring/pose'
import { JudgeSection, LessonSection, StepButtons, TargetSection, ViewSection } from '../../instruments/measuring/PracticeControls'
import { signedStep } from '../../instruments/measuring/practice'
import { ControlSection } from '../../ui/controls/ControlSection'
import { RangeField } from '../../ui/controls/RangeField'
import { SegmentedControl } from '../../ui/controls/SegmentedControl'
import { MEASURE_LABELS, digitsFor } from './state'
import type { CaliperSceneState } from './useCaliperSceneState'

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

export function CaliperControls({ state }: { state: CaliperSceneState }) {
  const digits = digitsFor(state.divisions)
  // Coarse → fine, mirrored: ±10 mm, ±1 mm and one vernier division.
  const steps = [-10, -1, -state.precision, state.precision, 1, 10].map((delta) => ({
    key: `caliper-step-${delta}`,
    label: `${signedStep(delta, Math.abs(delta) >= 1 ? 0 : digits)} mm`,
    onClick: () => state.setPosition(state.position + delta),
    disabled: state.locked,
  }))
  const stepButtons = <StepButtons hint={`步进（mm）：±10、±1、±${state.precision.toFixed(digits)}（一个精度）`} actions={steps} />

  return (
    <div className="measure-controls">
      <h2>游标卡尺控制</h2>

      <LessonSection
        state={state}
        summary={`${state.divisions} 分度 · ${MEASURE_LABELS[state.measure]}`}
        onLesson={state.setLesson}
      />

      {!state.challengeActive ? (
        <ControlSection title="分度与测量部位">
          <SegmentedControl options={DIVISIONS} value={String(state.divisions)} onChange={(key) => state.setDivisions(Number(key) as VernierDivisions)} />
          <SegmentedControl options={MEASURES} value={state.measure} onChange={(key) => state.setMeasure(key as CaliperMeasure)} />
        </ControlSection>
      ) : null}

      {!state.challengeActive && state.lesson === 'free' ? (
        <ControlSection title="自由调节位置">
          <RangeField
            id="caliper-x"
            label="尺框位置"
            min={0}
            max={150}
            step={state.precision}
            value={state.position}
            displayValue={`${caliperReading(state.position, state.divisions).text} mm`}
            unit="mm"
            onChange={state.setPosition}
          />
          {stepButtons}
        </ControlSection>
      ) : null}

      <ViewSection state={state} onView={state.setView} onLabels={state.setShowLabels} onFreeWork={state.setFreeWork} />

      {state.lesson === 'free' ? (
        <TargetSection state={state} label="目标示数（0～150 mm）" example="36.40" onGoTo={state.goTo} onHints={state.setHints} />
      ) : (
        <JudgeSection
          state={state}
          targetText={state.target === null ? null : state.target.toFixed(digits)}
          stepButtons={stepButtons}
          onAnswer={state.setAnswer}
          onAsk={state.askQuestion}
          onSubmit={state.submit}
        />
      )}

      <p className="measure-hint">{state.notice}</p>
    </div>
  )
}
