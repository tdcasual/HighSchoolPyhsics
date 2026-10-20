import { JudgeSection, LessonSection, StepButtons, TargetSection, ViewSection } from '../../instruments/measuring/PracticeControls'
import { signedStep } from '../../instruments/measuring/practice'
import { formatZero } from './state'
import { ControlSection } from '../../ui/controls/ControlSection'
import { RangeField } from '../../ui/controls/RangeField'
import type { MicrometerSceneState } from './useMicrometerSceneState'

export function MicrometerControls({ state }: { state: MicrometerSceneState }) {
  // Coarse → fine, mirrored: a full thimble turn is 0.5 mm, one division 0.01 mm, then the estimate.
  const steps = [-0.5, -0.01, -0.001, 0.001, 0.01, 0.5].map((delta) => ({
    key: `mic-step-${delta}`,
    label: signedStep(delta, Math.abs(delta) >= 0.5 ? 1 : Math.abs(delta) >= 0.01 ? 2 : 3),
    onClick: () => state.setGap(state.position + delta, 'fine'),
    disabled: state.locked,
  }))
  const stepButtons = <StepButtons hint="步进（mm）：±0.5 = 微分筒转一圈，±0.01 = 一格，±0.001 = 估读位" actions={steps} />

  return (
    <div className="measure-controls">
      <h2>螺旋测微器控制</h2>

      <LessonSection state={state} summary={`零点误差 ${formatZero(state.zero)}`} onLesson={state.setLesson} />

      {!state.challengeActive && state.lesson === 'free' ? (
        <ControlSection title="自由调节与零点设置">
          <RangeField
            id="mic-gap"
            label="螺杆间隙"
            min={0}
            max={25}
            step={0.001}
            value={state.position}
            displayValue={`${state.position.toFixed(3)} mm`}
            unit="mm"
            onChange={(value) => state.setGap(value, 'slider')}
          />
          {stepButtons}
          <RangeField
            id="mic-zero"
            label="零点误差"
            min={-0.05}
            max={0.05}
            step={0.001}
            value={state.zero}
            displayValue={formatZero(state.zero)}
            unit="mm"
            onChange={state.setZero}
          />
        </ControlSection>
      ) : null}

      <ViewSection state={state} onView={state.setView} onLabels={state.setShowLabels} onFreeWork={state.setFreeWork} />

      {state.lesson === 'free' ? (
        <TargetSection state={state} label="目标示数（0～25 mm）" example="6.125" onGoTo={state.goTo} onHints={state.setHints} />
      ) : (
        <JudgeSection
          state={state}
          targetText={state.target === null ? null : state.target.toFixed(3)}
          readHint={state.zero ? <p className="measure-hint">本题零点误差 {formatZero(state.zero)}：读出仪器示数即可。</p> : null}
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
