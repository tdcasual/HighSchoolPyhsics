import sceneCatalog from '../../config/demo-scenes.json'

export type DemoTone = 'scope' | 'cyclotron' | 'mhd' | 'oersted'

/** What an overview card shows for a scene. */
export type DemoRouteMeta = {
  tag: string
  summary: string
  highlights: string[]
  tone: DemoTone
  /** Paired scenes on the same topic: 入门 shows the principle, 进阶 the full apparatus or quantitative model. */
  level?: '入门' | '进阶'
}

/**
 * Card text per scene. Imported by the overview (a lazy chunk), so the full catalog with its
 * summaries and highlights stays out of the entry bundle.
 */
export const SCENE_CARDS: ReadonlyMap<string, DemoRouteMeta> = new Map(
  sceneCatalog.map((entry) => [entry.pageId, entry.meta as DemoRouteMeta]),
)
