export function resolveManualChunk(id: string): string | undefined {
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
