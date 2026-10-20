import { describe, expect, it } from 'vitest'
import sceneCatalog from '../../../config/demo-scenes.json'
import { NAVIGATION_VIEWS } from './navigationViews'
import { SCENE_NAVIGATION } from './sceneNavigation'

describe('scene navigation table', () => {
  it('files every catalog scene exactly once', () => {
    const filed = SCENE_NAVIGATION.map((scene) => scene.pageId)
    expect(new Set(filed).size).toBe(filed.length)
    expect([...filed].sort()).toEqual(sceneCatalog.map((entry) => entry.pageId).sort())
  })

  it('only names groups that exist in each view', () => {
    const groupIds = (viewId: string) => new Set(NAVIGATION_VIEWS.find((view) => view.id === viewId)!.groups.map((group) => group.id))
    const columns = [['chapter', 'textbook'], ['topic', 'topic'], ['lesson', 'lesson']] as const
    for (const scene of SCENE_NAVIGATION) {
      for (const [column, viewId] of columns) {
        expect(groupIds(viewId).has(scene[column]), `${scene.pageId}.${column} = ${scene[column]}`).toBe(true)
      }
    }
  })
})
