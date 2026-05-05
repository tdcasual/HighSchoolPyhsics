export type PhysicsRegion = {
  id: string
  name: string
  color: string
  hoverColor: string
  position: [number, number, number]
  description: string
  scenePageIds: string[]
}

export const PHYSICS_REGIONS: PhysicsRegion[] = [
  {
    id: 'electrostatics',
    name: '静电学',
    color: '#6366f1',
    hoverColor: '#818cf8',
    position: [4, 0, 3],
    description: '电场、电势与电荷分布',
    scenePageIds: ['equipotential', 'potential-energy', 'electrostatic-lab'],
  },
  {
    id: 'electromagnetism',
    name: '电磁学',
    color: '#f59e0b',
    hoverColor: '#fbbf24',
    position: [-4, 0, 3],
    description: '磁场、电流与洛伦兹力',
    scenePageIds: ['oersted', 'cyclotron'],
  },
  {
    id: 'electromagnetic-induction',
    name: '电磁感应',
    color: '#eab308',
    hoverColor: '#facc15',
    position: [0, 0, -1],
    description: '感应电动势与发电机原理',
    scenePageIds: [
      'induction-current',
      'motional-emf',
      'electromagnetic-drive',
      'rotational-emf',
      'alternator',
      'mhd',
    ],
  },
  {
    id: 'waves',
    name: '波动与振动',
    color: '#14b8a6',
    hoverColor: '#2dd4bf',
    position: [4, 0, -4],
    description: '机械波、波形与振动合成',
    scenePageIds: ['double-slit', 'oscilloscope'],
  },
  {
    id: 'mechanics',
    name: '力学',
    color: '#65a30d',
    hoverColor: '#84cc16',
    position: [-4, 0, -4],
    description: '运动、力与能量守恒',
    scenePageIds: [],
  },
  {
    id: 'thermal',
    name: '热学',
    color: '#dc2626',
    hoverColor: '#ef4444',
    position: [0, 0, -6],
    description: '热力学与分子动理论',
    scenePageIds: [],
  },
]

export function findRegionById(id: string): PhysicsRegion | undefined {
  return PHYSICS_REGIONS.find((r) => r.id === id)
}

export function getRegionSceneCount(region: PhysicsRegion): number {
  return region.scenePageIds.length
}
