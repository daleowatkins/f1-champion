import { describe, it, expect } from 'vitest'
import {
  carPerformanceMultiplier,
  computeDevBudgetGrowth,
  computeEngineerEffects,
  computeSupportVarianceModifier,
  computeTeamRatings,
  computeTeamStrength,
} from '../src/engine/ratings'
import type { DraftPick } from '../src/types/game'

const mockPicks: DraftPick[] = [
  { slot: 'driver1', option: { id: 'd1', name: 'Driver 1', rating: 90 }, sourceConstructorId: 'x', sourceConstructorName: 'X', sourceYear: 2020, historicalWccPosition: 3 },
  { slot: 'driver2', option: { id: 'd2', name: 'Driver 2', rating: 80 }, sourceConstructorId: 'x', sourceConstructorName: 'X', sourceYear: 2020, historicalWccPosition: 3 },
  { slot: 'chassis', option: { id: 'c1', name: 'Chassis', rating: 85 }, sourceConstructorId: 'x', sourceConstructorName: 'X', sourceYear: 2020, historicalWccPosition: 3 },
  { slot: 'engine', option: { id: 'e1', name: 'Engine', rating: 88 }, sourceConstructorId: 'x', sourceConstructorName: 'X', sourceYear: 2020, historicalWccPosition: 3 },
  { slot: 'teamPrincipal', option: { id: 'tp', name: 'TP', rating: 82 }, sourceConstructorId: 'x', sourceConstructorName: 'X', sourceYear: 2020, historicalWccPosition: 3 },
  { slot: 'engineerCrew', option: { id: 'eng', name: 'Engineers', rating: 75 }, sourceConstructorId: 'x', sourceConstructorName: 'X', sourceYear: 2020, historicalWccPosition: 3 },
  { slot: 'devBudget', option: { id: 'bud', name: 'Budget', rating: 70 }, sourceConstructorId: 'x', sourceConstructorName: 'X', sourceYear: 2020, historicalWccPosition: 3 },
  { slot: 'reserveDriver', option: { id: 'res', name: 'Reserve', rating: 60 }, sourceConstructorId: 'x', sourceConstructorName: 'X', sourceYear: 2020, historicalWccPosition: 3 },
]

describe('ratings', () => {
  it('computes team rating categories', () => {
    const ratings = computeTeamRatings(mockPicks)
    expect(ratings.driverLineup).toBeGreaterThan(80)
    expect(ratings.car).toBeGreaterThan(80)
    expect(ratings.support).toBeGreaterThan(60)
  })

  it('computes weighted team strength', () => {
    const strength = computeTeamStrength(mockPicks)
    expect(strength).toBeGreaterThan(70)
    expect(strength).toBeLessThan(95)
  })

  it('car rating gates driver performance multiplier', () => {
    expect(carPerformanceMultiplier(30)).toBeLessThan(carPerformanceMultiplier(90))
    expect(carPerformanceMultiplier(0)).toBe(0.4)
    expect(carPerformanceMultiplier(70)).toBeLessThan(0.85)
  })

  it('higher dev budget yields more in-season growth', () => {
    const ferrariBudget = computeDevBudgetGrowth([
      ...mockPicks.filter((p) => p.slot !== 'devBudget'),
      { slot: 'devBudget', option: { id: 'bud', name: 'Ferrari Budget', rating: 97 }, sourceConstructorId: 'x', sourceConstructorName: 'X', sourceYear: 2020 },
    ])
    const heskethBudget = computeDevBudgetGrowth([
      ...mockPicks.filter((p) => p.slot !== 'devBudget'),
      { slot: 'devBudget', option: { id: 'bud', name: 'Hesketh Budget', rating: 30 }, sourceConstructorId: 'x', sourceConstructorName: 'X', sourceYear: 2020 },
    ])
    expect(ferrariBudget).toBeGreaterThan(heskethBudget)
    expect(ferrariBudget).toBeGreaterThan(5)
    expect(heskethBudget).toBeLessThan(0)
  })

  it('higher support rating reduces driver variance', () => {
    const lowSupport = computeSupportVarianceModifier(30)
    const highSupport = computeSupportVarianceModifier(90)
    expect(highSupport).toBeLessThan(lowSupport)
  })

  it('better engineer crew reduces dnf and pitstop risk', () => {
    const bad = computeEngineerEffects(35)
    const good = computeEngineerEffects(90)
    expect(good.dnfChance).toBeLessThan(bad.dnfChance)
    expect(good.pitstopRisk).toBeLessThan(bad.pitstopRisk)
    expect(good.pitstopPenalty).toBeLessThan(bad.pitstopPenalty)
  })
})
