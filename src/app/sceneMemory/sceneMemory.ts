import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'

/**
 * Remembers the parameters a teacher set in each scene, so switching scenes during a lesson (or
 * reloading the tab) comes back to the same set-up. Keys are `<pageId>.<name>`; values live in
 * memory and are mirrored to sessionStorage, so a new tab / the next lesson starts from defaults.
 * Only parameters are remembered, never run state (running, elapsed time, records).
 */

const PREFIX = 'scene-memory:'
const memory = new Map<string, unknown>()

function isTestRuntime(): boolean {
  const env = (import.meta as { env?: Record<string, unknown> }).env
  return Boolean(env && (env.MODE === 'test' || env.VITEST === true))
}

function session(): Storage | null {
  if (typeof window === 'undefined' || isTestRuntime()) return null
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

export function readSceneMemory<T>(key: string): T | undefined {
  if (memory.has(key)) return memory.get(key) as T
  try {
    const raw = session()?.getItem(PREFIX + key)
    if (raw == null) return undefined
    const value = JSON.parse(raw) as T
    memory.set(key, value)
    return value
  } catch {
    return undefined
  }
}

export function writeSceneMemory(key: string, value: unknown): void {
  memory.set(key, value)
  try {
    session()?.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // Storage full or blocked: the in-memory copy still covers scene switches.
  }
}

/** Forget everything remembered for one scene (its keys start with `<pageId>.`). */
export function clearSceneMemory(pageId: string): void {
  const prefix = `${pageId}.`
  for (const key of [...memory.keys()]) if (key.startsWith(prefix)) memory.delete(key)
  const store = session()
  if (!store) return
  try {
    for (let i = store.length - 1; i >= 0; i--) {
      const key = store.key(i)
      if (key?.startsWith(PREFIX + prefix)) store.removeItem(key)
    }
  } catch {
    // ignore
  }
}

export function resetAllSceneMemory(): void {
  memory.clear()
}

/** Initial value for useState: the remembered one if any, else `initial` (value or initializer). */
export function recall<T>(key: string, initial: T | (() => T)): T {
  const remembered = readSceneMemory<T>(key)
  if (remembered !== undefined) return remembered
  return typeof initial === 'function' ? (initial as () => T)() : initial
}

/**
 * Saves a scene's parameters (`{ name: value }`) under `<pageId>.<name>` whenever they change.
 * Pair with `useState(() => recall('<pageId>.<name>', default))`; plain useState keeps setters stable.
 */
export function useRemember(pageId: string, values: Record<string, unknown>): void {
  const snapshot = JSON.stringify(values)
  useEffect(() => {
    for (const [name, value] of Object.entries(JSON.parse(snapshot) as Record<string, unknown>)) {
      writeSceneMemory(`${pageId}.${name}`, value)
    }
  }, [pageId, snapshot])
}

/** useState whose value survives leaving and re-entering the scene. */
export function usePersistentState<T>(key: string, initial: T | (() => T)): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    const remembered = readSceneMemory<T>(key)
    if (remembered !== undefined) return remembered
    return typeof initial === 'function' ? (initial as () => T)() : initial
  })
  useEffect(() => {
    writeSceneMemory(key, value)
  }, [key, value])
  return [value, setValue]
}

/** `initial` with the listed fields replaced by their remembered values, for object-shaped state. */
export function rememberFields<T extends object>(pageId: string, initial: T, fields: readonly (keyof T & string)[]): T {
  const restored = { ...initial }
  for (const field of fields) {
    const value = readSceneMemory<T[typeof field]>(`${pageId}.${field}`)
    if (value !== undefined) restored[field] = value
  }
  return restored
}

/** Saves the listed fields of object-shaped state whenever they change. */
export function useRememberFields<T extends object>(pageId: string, value: T, fields: readonly (keyof T & string)[]): void {
  const snapshot = JSON.stringify(fields.map((field) => value[field]))
  useEffect(() => {
    const values = JSON.parse(snapshot) as unknown[]
    fields.forEach((field, index) => writeSceneMemory(`${pageId}.${field}`, values[index]))
    // fields is a module-level constant per scene; snapshot captures the values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId, snapshot])
}
