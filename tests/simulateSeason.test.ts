import { describe, it, expect } from 'vitest'
import { seasonPackToSimulationGrid, simulateSeason } from '../src/engine/simulateSeason'
import type { DraftPick, SeasonPack } from '../src/types/game'
import fs from 'fs'
import path from 'path'

function loadMcLaren2004(): SeasonPack {
  const filePath = path.join(process.cwd(), 'public/data/seasons/2004/mclaren.json')
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

function withSource(pack: SeasonPack, slot: DraftPick['slot'], option: DraftPick['option']): DraftPick {
  return {
    slot,
    option,
    sourceConstructorId: pack.constructorId,
    sourceConstructorName: pack.constructorName,
    sourceYear: pack.year,
    historicalWccPosition: pack.historicalWccPosition,
  }
}

function bestPicks(pack: SeasonPack): DraftPick[] {
  const pool = pack.draftPool
  const bestDriver = [...pool.drivers].sort((a, b) => b.rating - a.rating)
  return [
    withSource(pack, 'driver1', bestDriver[0]),
    withSource(pack, 'driver2', bestDriver[1] ?? bestDriver[0]),
    withSource(pack, 'chassis', [...pool.chassis].sort((a, b) => b.rating - a.rating)[0]),
    withSource(pack, 'engine', [...pool.engines].sort((a, b) => b.rating - a.rating)[0]),
    withSource(pack, 'teamPrincipal', [...pool.teamPrincipals].sort((a, b) => b.rating - a.rating)[0]),
    withSource(pack, 'engineerCrew', [...pool.pitTeams].sort((a, b) => b.rating - a.rating)[0]),
    withSource(pack, 'devBudget', [...pool.devBudgets].sort((a, b) => b.rating - a.rating)[0]),
    withSource(pack, 'reserveDriver', pool.reserves[0]),
  ]
}

function worstPicks(pack: SeasonPack): DraftPick[] {
  const pool = pack.draftPool
  const worstDriver = [...pool.drivers].sort((a, b) => a.rating - b.rating)
  return [
    withSource(pack, 'driver1', worstDriver[0]),
    withSource(pack, 'driver2', worstDriver[1] ?? worstDriver[0]),
    withSource(pack, 'chassis', [...pool.chassis].sort((a, b) => a.rating - b.rating)[0]),
    withSource(pack, 'engine', [...pool.engines].sort((a, b) => a.rating - b.rating)[0]),
    withSource(pack, 'teamPrincipal', [...pool.teamPrincipals].sort((a, b) => a.rating - b.rating)[0]),
    withSource(pack, 'engineerCrew', [...pool.pitTeams].sort((a, b) => a.rating - b.rating)[0]),
    withSource(pack, 'devBudget', [...pool.devBudgets].sort((a, b) => a.rating - b.rating)[0]),
    withSource(pack, 'reserveDriver', pool.reserves[pool.reserves.length - 1]),
  ]
}

describe('simulateSeason', () => {
  const pack = loadMcLaren2004()
  const grid = seasonPackToSimulationGrid(pack)

  it('produces valid season result', () => {
    const result = simulateSeason(grid, bestPicks(pack))
    expect(result.wccPosition).toBeGreaterThan(0)
    expect(result.raceResults.length).toBe(pack.raceCount)
    expect(result.totalPoints).toBeGreaterThanOrEqual(0)
    expect(result.tier).toBeDefined()
    expect(result.standings.length).toBeGreaterThan(0)
  })

  it('never gives two drivers the same finishing position in a race', () => {
    const result = simulateSeason(grid, bestPicks(pack), 42)
    for (let round = 0; round < result.raceResults.length; round++) {
      const race = result.raceResults[round]
      if (
        typeof race.driver1Position === 'number' &&
        typeof race.driver2Position === 'number'
      ) {
        expect(race.driver1Position).not.toBe(race.driver2Position)
      }

      const winners = result.standings.filter((d) => d.races[round]?.position === 1)
      expect(winners.length).toBeLessThanOrEqual(1)
    }
  })

  it('best-rated draft usually outperforms worst-rated across seeds', () => {
    let bestWins = 0
    const runs = 12
    for (let seed = 0; seed < runs; seed++) {
      const best = simulateSeason(grid, bestPicks(pack), seed + 1)
      const worst = simulateSeason(grid, worstPicks(pack), seed + 1)
      if (best.wccPosition <= worst.wccPosition) bestWins++
    }
    expect(bestWins).toBeGreaterThanOrEqual(runs * 0.6)
  })

  it('best-rated McLaren 2004 is within 3 places of historical P3', () => {
    const result = simulateSeason(grid, bestPicks(pack), 42)
    expect(Math.abs(result.wccPosition - pack.historicalWccPosition)).toBeLessThanOrEqual(3)
  })

  it('is deterministic with same seed', () => {
    const a = simulateSeason(grid, bestPicks(pack), 99)
    const b = simulateSeason(grid, bestPicks(pack), 99)
    expect(a.totalPoints).toBe(b.totalPoints)
    expect(a.wccPosition).toBe(b.wccPosition)
  })
})
