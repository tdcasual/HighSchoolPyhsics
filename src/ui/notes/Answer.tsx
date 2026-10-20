import { useContext, useEffect, useState, type ReactNode } from 'react'
import { PredictionContext } from './predictionContext'

/**
 * A reading that answers the question the class is predicting (a direction, a computed result,
 * where a fringe lands). In prediction mode it shows "?" until the teacher clicks it or presses
 * 全部揭晓; otherwise it renders its value unchanged.
 */
export function Answer({ children }: { children: ReactNode }) {
  const { predicting, round, revealAll, register } = useContext(PredictionContext)
  const [revealedRound, setRevealedRound] = useState<number | null>(null)
  useEffect(register, [register])
  if (!predicting || revealAll || revealedRound === round) return <>{children}</>
  return (
    <button type="button" className="answer-mask" title="点击揭晓" onClick={() => setRevealedRound(round)}>
      ?
    </button>
  )
}

