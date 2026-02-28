export function safePreload(preload: () => Promise<void>): void {
  void preload().catch(() => undefined)
}
