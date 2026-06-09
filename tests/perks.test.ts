import { describe, it, expect } from 'vitest'
import {
  buildPlayerDnfProfile,
  creativeRulesCarMultiplier,
  devGrowthMultiplier,
} from '../src/engine/perks'

describe('perks', () => {
  const baseRates = { mechanical: 0.05, driverError: 0.04, crash: 0.02 }

  it('blocks mechanical DNFs with flawless engineering', () => {
    const profile = buildPlayerDnfProfile(baseRates, 'flawless-engineering')
    expect(profile.blockMechanical).toBe(true)
    expect(profile.blockDriverError).toBe(false)
  })

  it('blocks driver-error DNFs with wellbeing coach', () => {
    const profile = buildPlayerDnfProfile(baseRates, 'driver-wellbeing')
    expect(profile.blockMechanical).toBe(false)
    expect(profile.blockDriverError).toBe(true)
  })

  it('doubles development growth for huge sponsor', () => {
    expect(devGrowthMultiplier('huge-sponsor')).toBe(2)
    expect(devGrowthMultiplier(null)).toBe(1)
  })

  it('boosts car rating for first five rounds with creative rules', () => {
    expect(creativeRulesCarMultiplier(0, 'creative-rules')).toBe(1.2)
    expect(creativeRulesCarMultiplier(4, 'creative-rules')).toBe(1.2)
    expect(creativeRulesCarMultiplier(5, 'creative-rules')).toBe(1)
    expect(creativeRulesCarMultiplier(0, null)).toBe(1)
  })
})
