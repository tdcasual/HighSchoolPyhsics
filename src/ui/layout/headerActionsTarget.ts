import { createContext } from 'react'

/** The app header's slot for the scene's playback buttons on phones, if one is mounted. */
export const HeaderActionsTargetContext = createContext<HTMLElement | null>(null)
