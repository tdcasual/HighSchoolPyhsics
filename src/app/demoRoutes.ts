import { lazy } from 'react'
import type { ComponentType, LazyExoticComponent } from 'react'

export type DemoRoute = {
  path: string
  label: string
  Component: LazyExoticComponent<ComponentType>
}

const OscilloscopeScene = lazy(async () => {
  const mod = await import('../pages/OscilloscopePage')
  return { default: mod.OscilloscopePage }
})

const CyclotronScene = lazy(async () => {
  const mod = await import('../pages/CyclotronPage')
  return { default: mod.CyclotronPage }
})

const MhdGeneratorScene = lazy(async () => {
  const mod = await import('../pages/MhdPage')
  return { default: mod.MhdPage }
})

const OerstedScene = lazy(async () => {
  const mod = await import('../pages/OerstedPage')
  return { default: mod.OerstedPage }
})

export const DEMO_ROUTES: DemoRoute[] = [
  { path: '/oscilloscope', label: '示波器', Component: OscilloscopeScene },
  { path: '/cyclotron', label: '回旋加速器', Component: CyclotronScene },
  { path: '/mhd', label: '磁流体发电机', Component: MhdGeneratorScene },
  { path: '/oersted', label: '奥斯特实验', Component: OerstedScene },
]

export function normalizeDemoPath(pathname: string): string {
  if (!pathname || pathname === '/') {
    return '/'
  }

  const normalized = pathname.replace(/\/+$/, '')
  return normalized.startsWith('/') ? normalized : `/${normalized}`
}

export function findDemoRoute(pathname: string): DemoRoute | null {
  const normalized = normalizeDemoPath(pathname)
  return DEMO_ROUTES.find((route) => route.path === normalized) ?? null
}
