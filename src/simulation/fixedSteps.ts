/**
 * Spends `dt` plus the `carry` left from earlier frames in whole `fixedSeconds` sub-steps, for
 * physics that needs a constant dt. Stops early when `step` returns false (the process ended).
 */
export function runFixedSteps(
  carry: number,
  dt: number,
  fixedSeconds: number,
  step: (dt: number) => boolean | void,
): { carry: number; ended: boolean } {
  let left = carry + dt
  while (left + 1e-9 >= fixedSeconds) {
    left -= fixedSeconds
    if (step(fixedSeconds) === false) return { carry: 0, ended: true }
  }
  return { carry: left, ended: false }
}
