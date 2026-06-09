import { describe, it, expect } from 'vitest'
import { championshipPosition, rankedStandings } from '../src/engine/standingsRank'
import type { DriverSeasonStanding } from '../src/types/game'

function driver(id: string, points: number): DriverSeasonStanding {
  return {
    id,
    name: id,
    teamName: 'Team',
    isPlayer: id.startsWith('d'),
    races: [],
    totalPoints: points,
  }
}

describe('championshipPosition', () => {
  it('breaks ties by driver id so table and stats agree', () => {
    const standings = rankedStandings([
      driver('d1', 100),
      driver('alpine__gasly', 100),
      driver('d2', 50),
    ])
    expect(championshipPosition('d1', standings)).toBe(2)
    expect(championshipPosition('alpine__gasly', standings)).toBe(1)
  })

  it('ranks by current points, not final standings order', () => {
    const standings = [
      driver('d1', 25),
      driver('rival', 50),
      driver('d2', 10),
    ]
    expect(championshipPosition('d1', standings)).toBe(2)
    expect(championshipPosition('rival', standings)).toBe(1)
  })
})
