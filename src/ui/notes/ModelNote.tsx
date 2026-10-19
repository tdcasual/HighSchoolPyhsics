import { useContext, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ModelNoteTargetContext } from './modelNoteTarget'

/**
 * Model caveats and formulas that belong with a control but are too dense to project. Inside a
 * SceneLayout they render into the collapsed 教师备注 section at the end of the sidebar;
 * standalone (e.g. a controls unit test) they render in place.
 */
export function ModelNote({ children }: { children: ReactNode }) {
  const target = useContext(ModelNoteTargetContext)
  const note = <div className="model-note">{children}</div>
  return target ? createPortal(note, target) : note
}
