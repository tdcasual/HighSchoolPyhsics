import { describe, expect, it } from 'vitest'
import { deriveCyclotronLaunchState, deriveCyclotronMaximumKineticEnergyJ, type CyclotronConfig } from './model'
import { advanceCyclotronRun, cyclotronPeriodS, kineticEnergyJ } from './run'

const MEV = 1.6e-13
const R = 0.5
const config: CyclotronConfig = {
  chargeC: 1.6e-19,
  massKg: 1.67e-27,
  magneticFieldT: 1,
  electricFieldVPerM: 150e3 / 0.02,
  gapHalfWidthM: 0.01,
}

describe('textbook-scale cyclotron run', () => {
  it('accelerates a proton to q²B²R²/(2m) at the rim, about qU per gap crossing', () => {
    const periodS = cyclotronPeriodS(config)
    let run = { particle: deriveCyclotronLaunchState(config, 1e5), timeS: 0, extracted: false }
    let crossings = 0
    let lastSide = Math.sign(run.particle.position.y)
    for (let turn = 0; turn < 200 && !run.extracted; turn++) {
      run = advanceCyclotronRun(run, config, periodS, R, ({ particle }) => {
        const side = Math.sign(particle.position.y)
        if (side !== 0 && side !== lastSide) {
          crossings++
          lastSide = side
        }
      })
    }
    const energyMeV = kineticEnergyJ(run.particle, config.massKg) / MEV
    const theoreticalMeV = deriveCyclotronMaximumKineticEnergyJ(config, R) / MEV

    expect(run.extracted).toBe(true)
    expect(theoreticalMeV).toBeCloseTo(11.98, 1)
    // q²B²R²/(2m) assumes a centred orbit of radius R. Each gap crossing shifts the orbit centre,
    // so the particle reaches the rim with orbit radius r = mv/(qB) a gap-width or so below R.
    const speed = Math.hypot(run.particle.velocity.x, run.particle.velocity.y)
    const orbitRadiusM = (config.massKg * speed) / (config.chargeC * config.magneticFieldT)
    expect(orbitRadiusM).toBeLessThanOrEqual(R)
    expect(orbitRadiusM).toBeGreaterThan(R - 2 * 2 * config.gapHalfWidthM)
    expect(energyMeV).toBeGreaterThan(theoreticalMeV * 0.88)
    // Each crossing gives at most qU = 0.15 MeV, a little less when the RF has moved off its
    // peak during the transit.
    const meanGainMeV = energyMeV / crossings
    expect(meanGainMeV).toBeLessThanOrEqual(0.15)
    expect(meanGainMeV).toBeGreaterThan(0.13)
    expect(run.timeS / periodS).toBeLessThan(60)
  })
})
