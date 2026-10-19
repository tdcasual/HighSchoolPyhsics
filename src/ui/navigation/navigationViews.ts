import type { NavViewId } from '../../store/useAppStore'
import { PHYSICS_REGIONS, TEXTBOOK_VOLUMES } from './regionData'

/** One section of the overview: a chapter, a topic or a lesson type. */
export type NavigationGroup = {
  id: string
  title: string
  /** Short label shown before the title, e.g. the textbook volume. */
  badge?: string
  description: string
  color: string
  /** Scenes in teaching order within the group. */
  scenePageIds: string[]
  /** Groups sharing a jumpGroup collapse into one chip (e.g. all chapters of 必修三). */
  jumpGroup?: { id: string; label: string }
}

export type NavigationViewId = NavViewId

export type NavigationView = {
  id: NavViewId
  label: string
  /** One line under the title explaining how this view is organised. */
  caption: string
  groups: NavigationGroup[]
}

const TEXTBOOK_GROUPS: NavigationGroup[] = PHYSICS_REGIONS.map((region) => {
  const volume = TEXTBOOK_VOLUMES.find((v) => v.id === region.volumeId)!
  return {
    id: region.id,
    title: region.name,
    badge: volume.shortName,
    description: region.description,
    color: volume.color,
    scenePageIds: region.scenePageIds,
    jumpGroup: { id: volume.id, label: volume.name },
  }
})

/** Physics topics, regardless of which book teaches them. */
const TOPIC_GROUPS: NavigationGroup[] = [
  {
    id: 'mechanics',
    title: '力学',
    description: '直线运动的测量与天体运动',
    color: '#65a30d',
    scenePageIds: ['ticker-timer', 'cart-velocity', 'celestial-motion'],
  },
  {
    id: 'electric-field',
    title: '静电场',
    description: '电场线、电势、等势面与带电粒子的偏转',
    color: '#6366f1',
    scenePageIds: ['equipotential-dipole', 'potential-energy', 'equipotential', 'electrostatic-lab', 'oscilloscope-3d', 'oscilloscope'],
  },
  {
    id: 'circuits',
    title: '电路与电学测量',
    description: '长度测量、电阻率与多用电表',
    color: '#0891b2',
    scenePageIds: ['measuring-tools', 'resistivity', 'multimeter'],
  },
  {
    id: 'magnetic-field',
    title: '磁场与带电粒子',
    description: '电流的磁效应、洛伦兹力的应用',
    color: '#f59e0b',
    scenePageIds: ['oersted', 'cyclotron-core', 'cyclotron', 'mhd'],
  },
  {
    id: 'induction',
    title: '电磁感应与交变电流',
    description: '楞次定律、动生电动势、电磁驱动与发电机',
    color: '#db2777',
    scenePageIds: ['induction-current', 'motional-emf', 'rotational-emf', 'electromagnetic-drive', 'generator-core', 'alternator'],
  },
  {
    id: 'waves',
    title: '机械波与电磁波',
    description: '波的传播与干涉，电磁波的正交关系',
    color: '#14b8a6',
    scenePageIds: ['wave-state', 'wave-interference', 'orthogonal-em-wave'],
  },
  {
    id: 'optics',
    title: '光学',
    description: '双缝与薄膜干涉、光的衍射',
    color: '#7c3aed',
    scenePageIds: ['double-slit', 'wedge-interference', 'diffraction', 'light-diffraction'],
  },
  {
    id: 'thermal',
    title: '热学',
    description: '气体实验定律',
    color: '#dc2626',
    scenePageIds: ['ideal-gas-isochoric'],
  },
]

/** What the class does with the scene: run an experiment, build a model, or watch a phenomenon. */
const LESSON_GROUPS: NavigationGroup[] = [
  {
    id: 'experiments',
    title: '学生实验',
    description: '教材要求的分组实验：仪器使用、读数与数据处理',
    color: '#0891b2',
    scenePageIds: ['measuring-tools', 'ticker-timer', 'cart-velocity', 'resistivity', 'multimeter', 'double-slit'],
  },
  {
    id: 'models',
    title: '原理与模型',
    description: '把看不见的量画出来：场、电势、相位与轨道',
    color: '#6366f1',
    scenePageIds: [
      'equipotential-dipole',
      'potential-energy',
      'equipotential',
      'electrostatic-lab',
      'oscilloscope-3d',
      'cyclotron-core',
      'motional-emf',
      'rotational-emf',
      'generator-core',
      'wave-state',
      'orthogonal-em-wave',
      'celestial-motion',
    ],
  },
  {
    id: 'phenomena',
    title: '现象演示',
    description: '课堂上难以实际做或看不清的演示实验',
    color: '#db2777',
    scenePageIds: [
      'oersted',
      'induction-current',
      'electromagnetic-drive',
      'alternator',
      'cyclotron',
      'mhd',
      'oscilloscope',
      'wave-interference',
      'wedge-interference',
      'diffraction',
      'light-diffraction',
      'ideal-gas-isochoric',
    ],
  },
]

export const NAVIGATION_VIEWS: NavigationView[] = [
  { id: 'textbook', label: '按教材', caption: '按人教版教材分册与章节排列', groups: TEXTBOOK_GROUPS },
  { id: 'topic', label: '按专题', caption: '按物理专题排列，跨分册复习时使用', groups: TOPIC_GROUPS },
  { id: 'lesson', label: '按课型', caption: '按课堂用途排列：学生实验、原理建模、现象演示', groups: LESSON_GROUPS },
]

export function findNavigationView(id: string): NavigationView {
  return NAVIGATION_VIEWS.find((view) => view.id === id) ?? NAVIGATION_VIEWS[0]
}

/** Routes in the view's display order; card numbers and the 1–9 shortcuts follow it. */
export function orderRoutesForView<T extends { pageId: string }>(view: NavigationView, routes: T[]): T[] {
  const byId = new Map(routes.map((route) => [route.pageId, route]))
  return view.groups.flatMap((group) =>
    group.scenePageIds.flatMap((pageId) => {
      const route = byId.get(pageId)
      return route ? [route] : []
    }),
  )
}
