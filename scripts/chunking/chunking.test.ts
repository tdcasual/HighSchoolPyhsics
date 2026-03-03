import { describe, expect, it } from 'vitest'
import { resolveManualChunk } from './chunking'

describe('resolveManualChunk', () => {
  it('splits three core runtime into dedicated chunk', () => {
    const id = '/repo/node_modules/three/build/three.module.js'
    expect(resolveManualChunk(id)).toBe('vendor-three-core')
  })

  it('splits three extras into dedicated chunk', () => {
    const id = '/repo/node_modules/three-stdlib/controls/OrbitControls.js'
    expect(resolveManualChunk(id)).toBe('vendor-three-extras')
  })

  it('splits react three fiber into dedicated chunk', () => {
    const id = '/repo/node_modules/@react-three/fiber/dist/react-three-fiber.esm.js'
    expect(resolveManualChunk(id)).toBe('vendor-r3f')
  })

  it('splits react runtime into dedicated chunk', () => {
    const id = '/repo/node_modules/react/index.js'
    expect(resolveManualChunk(id)).toBe('vendor-react')
  })

  it('splits zustand into dedicated chunk', () => {
    const id = '/repo/node_modules/zustand/esm/index.mjs'
    expect(resolveManualChunk(id)).toBe('vendor-state')
  })

  it('keeps app modules in default chunking pipeline', () => {
    expect(resolveManualChunk('/repo/src/App.tsx')).toBeUndefined()
  })

  it('keeps unspecified node_modules for rollup default optimization', () => {
    expect(resolveManualChunk('/repo/node_modules/scheduler/index.js')).toBeUndefined()
  })
})
