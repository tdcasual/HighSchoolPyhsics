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
    description: '电场、电势与带电粒子的偏转',
    scenePageIds: ['equipotential', 'potential-energy', 'electrostatic-lab', 'equipotential-dipole', 'oscilloscope', 'oscilloscope-3d'],
  },
  {
    id: 'electromagnetism',
    name: '电磁学',
    color: '#f59e0b',
    hoverColor: '#fbbf24',
    position: [-4, 0, 3],
    description: '磁场、电流与洛伦兹力',
    scenePageIds: ['oersted', 'cyclotron', 'cyclotron-core', 'orthogonal-em-wave', 'resistivity', 'multimeter'],
  },
  {
    id: 'electromagnetic-induction',
    name: '电磁感应',
    color: '#db2777',
    hoverColor: '#f472b6',
    position: [0, 0, -1],
    description: '感应电动势与发电机原理',
    scenePageIds: [
      'induction-current',
      'motional-emf',
      'electromagnetic-drive',
      'rotational-emf',
      'alternator',
      'generator-core',
      'mhd',
    ],
  },
  {
    id: 'waves',
    name: '波动与光学',
    color: '#14b8a6',
    hoverColor: '#2dd4bf',
    position: [4, 0, -4],
    description: '机械波的传播、光的干涉与衍射',
    scenePageIds: ['wave-state', 'wave-interference', 'double-slit', 'wedge-interference', 'light-diffraction', 'diffraction'],
  },
  {
    id: 'mechanics',
    name: '力学',
    color: '#65a30d',
    hoverColor: '#84cc16',
    position: [-4, 0, -4],
    description: '长度测量、匀变速运动与天体运动',
    scenePageIds: ['measuring-tools', 'ticker-timer', 'cart-velocity', 'celestial-motion'],
  },
  {
    id: 'thermal',
    name: '热学',
    color: '#dc2626',
    hoverColor: '#ef4444',
    position: [0, 0, -6],
    description: '热力学与分子动理论',
    scenePageIds: ['ideal-gas-isochoric'],
  },
]

export function findRegionById(id: string): PhysicsRegion | undefined {
  return PHYSICS_REGIONS.find((r) => r.id === id)
}

export function getRegionSceneCount(region: PhysicsRegion): number {
  return region.scenePageIds.length
}
