import { describe, it, expect } from 'vitest'
import { computeSeasonAchievements } from '../src/engine/seasonAchievements'
import type { SeasonResult } from '../src/types/game'

function stubResult(overrides: Partial<SeasonResult>): SeasonResult {
  return {
    tier: 'podium-team',
    wccPosition: 2,
    wdcPosition: 2,
    driver2WdcPosition: 5,
    totalPoints: 300,
    wins: 5,
    podiums: 15,
    poles: 4,
    raceResults: [
      { round: 1, grandPrix: 'Test', grandPrixCode: 'TST', driver1Position: 1, driver2Position: 2, driver1Points: 25, driver2Points: 18, teamPoints: 43 },
      { round: 2, grandPrix: 'Test 2', grandPrixCode: 'TS2', driver1Position: 2, driver2Position: 3, driver1Points: 18, driver2Points: 15, teamPoints: 33 },
    ],
    standings: [],
    calendar: ['Test', 'Test 2'],
    teamStrength: 80,
    teamRatings: { driverLineup: 85, car: 88, support: 70 },
    constructorName: 'Dream Team',
    year: 2026,
    seasonPerk: null,
    ...overrides,
  }
}

describe('seasonAchievements', () => {
  it('treats WDC and WC as separate achievements', () => {
    const wdcOnly = computeSeasonAchievements(stubResult({ wdcPosition: 1, wccPosition: 2 }))
    expect(wdcOnly.find((x) => x.id === 'wdc')?.achieved).toBe(true)
    expect(wdcOnly.find((x) => x.id === 'wc')?.achieved).toBe(false)

    const double = computeSeasonAchievements(stubResult({ wdcPosition: 1, wccPosition: 1 }))
    expect(double.find((x) => x.id === 'wdc')?.achieved).toBe(true)
    expect(double.find((x) => x.id === 'wc')?.achieved).toBe(true)
  })

  it('detects perfect season feats', () => {
    const perfect = stubResult({
      wdcPosition: 1,
      wccPosition: 1,
      wins: 2,
      raceResults: [
        { round: 1, grandPrix: 'A', grandPrixCode: 'A', driver1Position: 1, driver2Position: 2, driver1Points: 25, driver2Points: 18, teamPoints: 43 },
        { round: 2, grandPrix: 'B', grandPrixCode: 'B', driver1Position: 2, driver2Position: 1, driver1Points: 18, driver2Points: 25, teamPoints: 43 },
      ],
    })
    const ids = computeSeasonAchievements(perfect).filter((x) => x.achieved).map((x) => x.id)
    expect(ids).toContain('wdc')
    expect(ids).toContain('wc')
    expect(ids).toContain('podium-every-race')
    expect(ids).toContain('no-retirements')
    expect(ids).toContain('win-every-race')
  })

  it('fails podiums when both drivers retire', () => {
    const result = stubResult({
      raceResults: [
        { round: 1, grandPrix: 'A', grandPrixCode: 'A', driver1Position: 'DNF', driver2Position: 'DNF', driver1Points: 0, driver2Points: 0, teamPoints: 0 },
      ],
    })
    expect(computeSeasonAchievements(result).find((x) => x.id === 'podium-every-race')?.achieved).toBe(false)
  })
})
