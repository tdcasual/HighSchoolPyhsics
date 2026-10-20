import { describe, expect, it } from 'vitest'
import { refract } from './model'

describe('refraction model', () => {
  it("Snell's law: air → glass at 30° gives sin r = sin30°/1.5", () => {
    const out = refract({ from: 'air', to: 'glass', incidenceDeg: 30 })
    expect(Math.sin((out.refractionDeg! * Math.PI) / 180)).toBeCloseTo(0.5 / 1.5, 12)
    expect(out.criticalDeg).toBeNull()
    expect(out.totalReflection).toBe(false)
  })

  it('glass → air: critical angle 41.8°, total internal reflection beyond it', () => {
    expect(refract({ from: 'glass', to: 'air', incidenceDeg: 40 }).criticalDeg).toBeCloseTo(41.81, 2)
    expect(refract({ from: 'glass', to: 'air', incidenceDeg: 41 }).totalReflection).toBe(false)
    const beyond = refract({ from: 'glass', to: 'air', incidenceDeg: 43 })
    expect(beyond.totalReflection).toBe(true)
    expect(beyond.refractionDeg).toBeNull()
    expect(beyond.reflectance).toBe(1)
  })

  it('reflectance: ~4 % at normal incidence on glass, rising towards grazing incidence', () => {
    expect(refract({ from: 'air', to: 'glass', incidenceDeg: 0.0001 }).reflectance).toBeCloseTo(0.04, 3)
    expect(refract({ from: 'air', to: 'glass', incidenceDeg: 80 }).reflectance).toBeGreaterThan(0.3)
    // Just below the critical angle almost all light is already reflected.
    expect(refract({ from: 'glass', to: 'air', incidenceDeg: 41.7 }).reflectance).toBeGreaterThan(0.6)
  })
})
