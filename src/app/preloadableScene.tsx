import type { ComponentType } from 'react'

type LoadedSceneModule = {
  default: ComponentType
}

type SceneLoadState =
  | { status: 'idle' }
  | { status: 'pending'; promise: Promise<LoadedSceneModule> }
  | { status: 'resolved'; module: LoadedSceneModule }
  | { status: 'rejected'; error: unknown }

export function createPreloadableScene(
  loadModule: () => Promise<LoadedSceneModule>,
): {
  Component: ComponentType
  preload: () => Promise<void>
} {
  let state: SceneLoadState = { status: 'idle' }

  const startLoading = (): Promise<LoadedSceneModule> => {
    if (state.status === 'resolved') {
      return Promise.resolve(state.module)
    }

    if (state.status === 'pending') {
      return state.promise
    }

    const promise = loadModule()
      .then((loadedModule) => {
        state = { status: 'resolved', module: loadedModule }
        return loadedModule
      })
      .catch((error: unknown) => {
        state = { status: 'rejected', error }
        throw error
      })

    state = { status: 'pending', promise }
    return promise
  }

  const preload = async () => {
    if (state.status === 'rejected') {
      state = { status: 'idle' }
    }
    await startLoading()
  }

  const Component: ComponentType = () => {
    if (state.status === 'resolved') {
      const LoadedScene = state.module.default
      return <LoadedScene />
    }

    if (state.status === 'rejected') {
      throw state.error
    }

    throw startLoading()
  }

  return {
    Component,
    preload,
  }
}
