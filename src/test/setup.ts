import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { installThreeConsoleFilter } from '../scene3d/threeConsoleFilter'
import { resetAllSceneMemory } from '../app/sceneMemory/sceneMemory'

installThreeConsoleFilter()

afterEach(() => {
  cleanup()
  // Scene parameters are remembered across mounts; tests must not inherit each other's set-up.
  resetAllSceneMemory()
})
