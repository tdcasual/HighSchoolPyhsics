/** Where a scene sits in each overview view: textbook chapter, physics topic and lesson type. */
export type SceneNavigation = {
  pageId: string
  /** `PHYSICS_REGIONS` id (人教版 2019 chapter). */
  chapter: string
  /** Topic group id in the 按专题 view. */
  topic: string
  /** Lesson-type group id in the 按课型 view. */
  lesson: 'experiments' | 'models' | 'phenomena'
}

/**
 * The single place a scene is filed for the overview, one row per scene in textbook teaching
 * order. Every view lists its groups' scenes in this order, so a new scene is one row here
 * (plus its entry in config/demo-scenes.json).
 */
export const SCENE_NAVIGATION: readonly SceneNavigation[] = [
  { pageId: 'ticker-timer', chapter: 'kinematics', topic: 'mechanics', lesson: 'experiments' },
  { pageId: 'cart-velocity', chapter: 'kinematics', topic: 'mechanics', lesson: 'experiments' },
  { pageId: 'projectile-motion', chapter: 'projectile', topic: 'mechanics', lesson: 'models' },
  { pageId: 'circular-motion', chapter: 'circular', topic: 'mechanics', lesson: 'models' },
  { pageId: 'celestial-motion', chapter: 'gravitation', topic: 'mechanics', lesson: 'models' },
  { pageId: 'mechanical-energy', chapter: 'energy', topic: 'mechanics', lesson: 'models' },
  { pageId: 'equipotential-dipole', chapter: 'electrostatics', topic: 'electric-field', lesson: 'models' },
  { pageId: 'potential-energy', chapter: 'electric-potential', topic: 'electric-field', lesson: 'models' },
  { pageId: 'equipotential', chapter: 'electric-potential', topic: 'electric-field', lesson: 'models' },
  { pageId: 'electrostatic-lab', chapter: 'electric-potential', topic: 'electric-field', lesson: 'models' },
  { pageId: 'oscilloscope-3d', chapter: 'electric-potential', topic: 'electric-field', lesson: 'models' },
  { pageId: 'oscilloscope', chapter: 'electric-potential', topic: 'electric-field', lesson: 'phenomena' },
  { pageId: 'vernier-caliper', chapter: 'circuits', topic: 'circuits', lesson: 'experiments' },
  { pageId: 'micrometer', chapter: 'circuits', topic: 'circuits', lesson: 'experiments' },
  { pageId: 'resistivity', chapter: 'circuits', topic: 'circuits', lesson: 'experiments' },
  { pageId: 'multimeter', chapter: 'circuits', topic: 'circuits', lesson: 'experiments' },
  { pageId: 'oersted', chapter: 'magnetism-intro', topic: 'magnetic-field', lesson: 'phenomena' },
  { pageId: 'momentum-collision', chapter: 'momentum', topic: 'mechanics', lesson: 'experiments' },
  { pageId: 'simple-pendulum', chapter: 'oscillation', topic: 'waves', lesson: 'experiments' },
  { pageId: 'wave-state', chapter: 'mechanical-waves', topic: 'waves', lesson: 'models' },
  { pageId: 'wave-interference', chapter: 'mechanical-waves', topic: 'waves', lesson: 'phenomena' },
  { pageId: 'light-refraction', chapter: 'light', topic: 'optics', lesson: 'phenomena' },
  { pageId: 'double-slit', chapter: 'light', topic: 'optics', lesson: 'experiments' },
  { pageId: 'wedge-interference', chapter: 'light', topic: 'optics', lesson: 'phenomena' },
  { pageId: 'diffraction', chapter: 'light', topic: 'optics', lesson: 'phenomena' },
  { pageId: 'light-diffraction', chapter: 'light', topic: 'optics', lesson: 'phenomena' },
  { pageId: 'cyclotron-core', chapter: 'lorentz-force', topic: 'magnetic-field', lesson: 'models' },
  { pageId: 'cyclotron', chapter: 'lorentz-force', topic: 'magnetic-field', lesson: 'phenomena' },
  { pageId: 'mhd', chapter: 'lorentz-force', topic: 'magnetic-field', lesson: 'phenomena' },
  { pageId: 'induction-current', chapter: 'electromagnetic-induction', topic: 'induction', lesson: 'phenomena' },
  { pageId: 'motional-emf', chapter: 'electromagnetic-induction', topic: 'induction', lesson: 'models' },
  { pageId: 'rotational-emf', chapter: 'electromagnetic-induction', topic: 'induction', lesson: 'models' },
  { pageId: 'electromagnetic-drive', chapter: 'electromagnetic-induction', topic: 'induction', lesson: 'phenomena' },
  { pageId: 'generator-core', chapter: 'alternating-current', topic: 'induction', lesson: 'models' },
  { pageId: 'alternator', chapter: 'alternating-current', topic: 'induction', lesson: 'phenomena' },
  { pageId: 'orthogonal-em-wave', chapter: 'em-waves', topic: 'waves', lesson: 'models' },
  { pageId: 'ideal-gas-isochoric', chapter: 'gases', topic: 'thermal', lesson: 'phenomena' },
]

/** Scene ids filed under `id` in one view, in teaching order. */
export function scenesIn(view: 'chapter' | 'topic' | 'lesson', id: string): string[] {
  return SCENE_NAVIGATION.filter((scene) => scene[view] === id).map((scene) => scene.pageId)
}
