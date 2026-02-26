type NetworkInformationLike = {
  saveData?: boolean
  effectiveType?: string
}

const DISABLED_EFFECTIVE_TYPES = new Set(['slow-2g', '2g'])

function hasFinePointer(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return true
  }

  return window.matchMedia('(pointer: fine)').matches
}

function hasConstrainedConnection(connection: NetworkInformationLike | undefined): boolean {
  if (!connection) {
    return false
  }

  if (connection.saveData) {
    return true
  }

  const effectiveType = connection.effectiveType?.toLowerCase()
  return effectiveType ? DISABLED_EFFECTIVE_TYPES.has(effectiveType) : false
}

export function shouldWarmRouteOnOverview(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false
  }

  if (!hasFinePointer()) {
    return false
  }

  const connection = (navigator as Navigator & { connection?: NetworkInformationLike }).connection
  return !hasConstrainedConnection(connection)
}
