type NetworkInformationLike = {
  saveData?: boolean
  effectiveType?: string
  downlink?: number
  rtt?: number
}

type NavigatorPerformanceLike = {
  deviceMemory?: number
  hardwareConcurrency?: number
}

const DISABLED_EFFECTIVE_TYPES = new Set(['slow-2g', '2g', '3g'])
const MIN_DEVICE_MEMORY_GB = 4
const MIN_HARDWARE_CONCURRENCY = 4
const MIN_DOWNLINK_MBPS = 1.5
const MAX_RTT_MS = 300

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
  if (effectiveType && DISABLED_EFFECTIVE_TYPES.has(effectiveType)) {
    return true
  }

  if (
    typeof connection.downlink === 'number' &&
    connection.downlink > 0 &&
    connection.downlink < MIN_DOWNLINK_MBPS
  ) {
    return true
  }

  if (
    typeof connection.rtt === 'number' &&
    connection.rtt > 0 &&
    connection.rtt > MAX_RTT_MS
  ) {
    return true
  }

  return false
}

function hasEnoughDeviceProfile(navigatorLike: NavigatorPerformanceLike): boolean {
  if (
    typeof navigatorLike.deviceMemory === 'number' &&
    navigatorLike.deviceMemory > 0 &&
    navigatorLike.deviceMemory < MIN_DEVICE_MEMORY_GB
  ) {
    return false
  }

  if (
    typeof navigatorLike.hardwareConcurrency === 'number' &&
    navigatorLike.hardwareConcurrency > 0 &&
    navigatorLike.hardwareConcurrency < MIN_HARDWARE_CONCURRENCY
  ) {
    return false
  }

  return true
}

export function shouldWarmRouteOnOverview(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false
  }

  if (!hasFinePointer()) {
    return false
  }

  const connection = (navigator as Navigator & { connection?: NetworkInformationLike }).connection
  if (hasConstrainedConnection(connection)) {
    return false
  }

  return hasEnoughDeviceProfile(navigator as Navigator & NavigatorPerformanceLike)
}
