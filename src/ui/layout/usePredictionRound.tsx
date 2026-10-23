import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useAppStore } from '../../store/useAppStore'
import type { PredictionState } from '../notes/predictionContext'

/**
 * Prediction mode for one scene: the context its <Answer>s read, whether the chart is covered,
 * and the 预测 / 全部揭晓 buttons for the data panel's header (only when there is something to hide).
 */
export function usePredictionRound(chartMaskable: boolean) {
  const predicting = useAppStore((s) => s.predicting)
  const setPredicting = useAppStore((s) => s.setPredicting)
  const [answerCount, setAnswerCount] = useState(0)
  const [round, setRound] = useState({ predicting, round: 0, revealAll: false })
  // A new round starts whenever prediction mode turns on (adjusting state during render).
  if (round.predicting !== predicting) {
    setRound((current) => ({
      predicting,
      round: predicting ? current.round + 1 : current.round,
      revealAll: false,
    }))
  }
  const register = useCallback(() => {
    setAnswerCount((count) => count + 1)
    return () => setAnswerCount((count) => count - 1)
  }, [])
  const prediction = useMemo<PredictionState>(
    () => ({ predicting, round: round.round, revealAll: round.revealAll, register }),
    [predicting, round.round, round.revealAll, register],
  )

  // Charts usually plot the outcome too (e.g. P's future displacement), so in prediction mode the
  // chart stays covered until the teacher opens it or reveals everything.
  const [chartRevealedRound, setChartRevealedRound] = useState<number | null>(null)
  const chartMasked =
    chartMaskable && predicting && answerCount > 0 && !round.revealAll && chartRevealedRound !== round.round

  const headerActions: ReactNode =
    answerCount > 0 ? (
      <>
        {predicting && !round.revealAll ? (
          <button
            type="button"
            className="panel-text-button"
            onClick={() => setRound((current) => ({ ...current, revealAll: true }))}
          >
            全部揭晓
          </button>
        ) : null}
        <button
          type="button"
          className={`panel-text-button${predicting ? ' active' : ''}`}
          aria-pressed={predicting}
          aria-keyshortcuts="H"
          title="预测模式：先遮住结论，学生预测后再揭晓（快捷键 H）"
          onClick={() => setPredicting(!predicting)}
        >
          预测
        </button>
      </>
    ) : null

  return { prediction, chartMasked, revealChart: () => setChartRevealedRound(round.round), headerActions }
}
