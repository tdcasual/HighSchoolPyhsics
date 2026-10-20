import { scenesIn } from './sceneNavigation'

/** A textbook volume (人教版 2019) that groups chapters on the overview page. */
export type TextbookVolume = {
  id: string
  name: string
  shortName: string
  color: string
}

/** One textbook chapter; scenes are listed in teaching order within it. */
export type PhysicsRegion = {
  id: string
  volumeId: string
  /** Chapter number and title as printed in the textbook, e.g. 第十一章 电路及其应用. */
  name: string
  description: string
  /** Derived from `SCENE_NAVIGATION`, in teaching order. */
  scenePageIds: string[]
}

export const TEXTBOOK_VOLUMES: TextbookVolume[] = [
  { id: 'required-1', name: '必修第一册', shortName: '必修一', color: '#65a30d' },
  { id: 'required-2', name: '必修第二册', shortName: '必修二', color: '#0891b2' },
  { id: 'required-3', name: '必修第三册', shortName: '必修三', color: '#6366f1' },
  { id: 'elective-1', name: '选择性必修第一册', shortName: '选必一', color: '#14b8a6' },
  { id: 'elective-2', name: '选择性必修第二册', shortName: '选必二', color: '#db2777' },
  { id: 'elective-3', name: '选择性必修第三册', shortName: '选必三', color: '#dc2626' },
]

const CHAPTERS: Omit<PhysicsRegion, 'scenePageIds'>[] = [
  {
    id: 'kinematics',
    volumeId: 'required-1',
    name: '第二章 匀变速直线运动的研究',
    description: '打点计时器与纸带测速，v-t 图像求加速度',
  },
  {
    id: 'projectile',
    volumeId: 'required-2',
    name: '第五章 抛体运动',
    description: '运动的合成与分解，平抛与斜抛',
  },
  {
    id: 'circular',
    volumeId: 'required-2',
    name: '第六章 圆周运动',
    description: '向心力、向心加速度与离心现象',
  },
  {
    id: 'gravitation',
    volumeId: 'required-2',
    name: '第七章 万有引力与宇宙航行',
    description: '卫星的速度、周期与变轨',
  },
  {
    id: 'energy',
    volumeId: 'required-2',
    name: '第八章 机械能守恒定律',
    description: '动能、重力势能与机械能守恒',
  },
  {
    id: 'electrostatics',
    volumeId: 'required-3',
    name: '第九章 静电场及其应用',
    description: '电场线与场强的矢量叠加',
  },
  {
    id: 'electric-potential',
    volumeId: 'required-3',
    name: '第十章 静电场中的能量',
    description: '电势、等势面与带电粒子在电场中的偏转',
  },
  {
    id: 'circuits',
    volumeId: 'required-3',
    name: '第十一章 电路及其应用',
    description: '长度测量、电阻率测量与多用电表',
  },
  {
    id: 'magnetism-intro',
    volumeId: 'required-3',
    name: '第十三章 电磁感应与电磁波初步',
    description: '电流的磁效应',
  },
  {
    id: 'momentum',
    volumeId: 'elective-1',
    name: '第一章 动量守恒定律',
    description: '碰撞中的动量守恒与动能变化',
  },
  {
    id: 'oscillation',
    volumeId: 'elective-1',
    name: '第二章 机械振动',
    description: '简谐运动与单摆',
  },
  {
    id: 'mechanical-waves',
    volumeId: 'elective-1',
    name: '第三章 机械波',
    description: '波的形成与传播、波的干涉',
  },
  {
    id: 'light',
    volumeId: 'elective-1',
    name: '第四章 光',
    description: '光的折射与全反射、干涉与衍射',
  },
  {
    id: 'lorentz-force',
    volumeId: 'elective-2',
    name: '第一章 安培力与洛伦兹力',
    description: '回旋加速器与磁流体发电机',
  },
  {
    id: 'electromagnetic-induction',
    volumeId: 'elective-2',
    name: '第二章 电磁感应',
    description: '楞次定律、动生电动势与电磁驱动',
  },
  {
    id: 'alternating-current',
    volumeId: 'elective-2',
    name: '第三章 交变电流',
    description: '交变电流的产生',
  },
  {
    id: 'em-waves',
    volumeId: 'elective-2',
    name: '第四章 电磁振荡与电磁波',
    description: '电磁波中 E、B 与传播方向的关系',
  },
  {
    id: 'gases',
    volumeId: 'elective-3',
    name: '第二章 气体、固体和液体',
    description: '气体的等容变化（查理定律）',
  },
]

export const PHYSICS_REGIONS: PhysicsRegion[] = CHAPTERS.map((chapter) => ({ ...chapter, scenePageIds: scenesIn('chapter', chapter.id) }))

export function findRegionById(id: string): PhysicsRegion | undefined {
  return PHYSICS_REGIONS.find((r) => r.id === id)
}

export function findVolumeById(id: string): TextbookVolume | undefined {
  return TEXTBOOK_VOLUMES.find((v) => v.id === id)
}

export function getRegionSceneCount(region: PhysicsRegion): number {
  return region.scenePageIds.length
}
