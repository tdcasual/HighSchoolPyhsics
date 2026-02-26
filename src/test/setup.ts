import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { installThreeConsoleFilter } from '../scene3d/threeConsoleFilter'

installThreeConsoleFilter()

afterEach(() => {
  cleanup()
})
