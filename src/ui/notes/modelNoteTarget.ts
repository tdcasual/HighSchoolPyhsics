import { createContext } from 'react'

/** The 教师备注 container of the current SceneLayout, if one is mounted. */
export const ModelNoteTargetContext = createContext<HTMLElement | null>(null)
