import { createContext, useContext } from 'react'

export type PredictionState = {
  /** Conclusions are masked until the teacher reveals them. */
  predicting: boolean
  /** Bumped each time prediction mode turns on, so answers opened in an earlier round mask again. */
  round: number
  /** 全部揭晓 was pressed in the current round. */
  revealAll: boolean
  /** Each mounted <Answer> registers, so the layout only offers 预测 where there is something to hide. */
  register: () => () => void
}

export const PredictionContext = createContext<PredictionState>({
  predicting: false,
  round: 0,
  revealAll: false,
  register: () => () => {},
})

/**
 * True while prediction mode is hiding answers that are not wrapped in <Answer>, e.g. the
 * highlighted lines of a reading figure the class is reading from.
 */
export function usePredictionMasked(): boolean {
  const { predicting, revealAll } = useContext(PredictionContext)
  return predicting && !revealAll
}
