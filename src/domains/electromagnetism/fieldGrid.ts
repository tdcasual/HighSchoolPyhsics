import type { ArrowPoint } from '../../scene3d/arrowGeometry'

/** Every combination of the given x, y and z positions (row by row), for laying out field arrows. */
export function fieldGrid(xs: readonly number[], ys: readonly number[], zs: readonly number[]): ArrowPoint[] {
  return xs.flatMap((x) => ys.flatMap((y) => zs.map((z): ArrowPoint => [x, y, z])))
}
