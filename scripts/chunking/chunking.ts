export function resolveManualChunk(id: string): string | undefined {
  // Rollup virtual helpers (Vite's preload helper, commonjs interop) are imported by the entry;
  // left alone they land in whichever vendor chunk shares them first (it was vendor-r3f), which
  // made the homepage statically depend on, and preload, R3F and three.js.
  if (id.startsWith('\0')) {
    return 'vendor-react'
  }

  if (!id.includes('/node_modules/')) {
    return undefined
  }

  if (id.includes('/node_modules/three/examples/') || id.includes('/node_modules/three-stdlib/')) {
    return 'vendor-three-extras'
  }

  if (id.includes('/node_modules/three/')) {
    return 'vendor-three-core'
  }

  if (id.includes('/node_modules/@react-three/')) {
    return 'vendor-r3f'
  }

  if (id.includes('/node_modules/react/') || id.includes('/node_modules/react-dom/')) {
    return 'vendor-react'
  }

  if (id.includes('/node_modules/zustand/')) {
    return 'vendor-state'
  }

  return undefined
}
