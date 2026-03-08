export function safePreload(preload: unknown): void {
  if (typeof preload !== 'function') {
    return
  }

  try {
    const result = preload()
    if (result && typeof (result as Promise<unknown>).catch === 'function') {
      void (result as Promise<unknown>).catch(() => undefined)
    }
  } catch {
    return
  }
}
