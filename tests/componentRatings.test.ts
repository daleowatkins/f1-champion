import { describe, it, expect } from 'vitest'
import {
  calibrateChassisOvr,
  calibrateEngineOvr,
  isGoatChassis,
  isGoatEngine,
} from '../scripts/component-ratings'

describe('componentRatings', () => {
  it('recognises curated GOAT chassis and engines', () => {
    expect(isGoatChassis('mclaren-mp4-4')).toBe(true)
    expect(isGoatChassis('red-bull-rb19')).toBe(true)
    expect(isGoatChassis('mclaren-mcl38')).toBe(false)
    expect(isGoatEngine('honda-ra168e-15-v6-t')).toBe(true)
    expect(isGoatEngine('ferrari-066-10-16-v6-t-h')).toBe(false)
  })

  it('GOAT chassis hits 94 only in dominant seasons', () => {
    const dominant = calibrateChassisOvr('mclaren-mp4-4', 99, {
      seasonStrength: 99,
      wccPosition: 1,
    })
    const weak = calibrateChassisOvr('mclaren-mp4-4', 99, {
      seasonStrength: 70,
      wccPosition: 5,
    })
    expect(dominant).toBe(94)
    expect(weak).toBeLessThan(85)
  })

  it('non-GOAT chassis caps below elite tier', () => {
    const rating = calibrateChassisOvr('mclaren-mcl38', 99, {
      seasonStrength: 99,
      wccPosition: 1,
    })
    expect(rating).toBe(88)
  })

  it('GOAT engine peaks in WCC-winning seasons', () => {
    expect(
      calibrateEngineOvr('ferrari-053-30-v10', 99, {
        seasonStrength: 99,
        wccPosition: 1,
      }),
    ).toBe(94)

    expect(
      calibrateEngineOvr('ferrari-053-30-v10', 85, {
        seasonStrength: 60,
        wccPosition: 8,
      }),
    ).toBeLessThanOrEqual(80)
  })
})
