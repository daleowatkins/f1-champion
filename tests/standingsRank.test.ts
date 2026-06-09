import { describe, it, expect } from 'vitest'
import { championshipPosition } from '../src/engine/standingsRank'
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
