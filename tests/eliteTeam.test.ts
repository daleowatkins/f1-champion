import { describe, it, expect } from 'vitest'
import { seasonPackToSimulationGrid, simulateSeason } from '../src/engine/simulateSeason'
import type { DraftPick, DraftOption, SeasonPack } from '../src/types/game'
import fs from 'fs'
import path from 'path'

function loadPack(year: number, constructorId: string): SeasonPack {
  const filePath = path.join(process.cwd(), 'public/data/seasons', String(year), `${constructorId}.json`)
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

function elitePicks(pack: SeasonPack): DraftPick[] {
  const pool = pack.draftPool
  const pick = (slot: DraftPick['slot'], option: DraftOption): DraftPick => ({
    slot,
    option,
    sourceConstructorId: pack.constructorId,
    sourceConstructorName: pack.constructorName,
    sourceYear: pack.year,
    historicalWccPosition: pack.historicalWccPosition,
  })
  const bestDriver = [...pool.drivers].sort((a, b) => b.rating - a.rating)
  const maxRating = (opts: DraftOption[]) =>
    [...opts].sort((a, b) => b.rating - a.rating)[0]

  return [
    pick('driver1', bestDriver[0]),
    pick('driver2', bestDriver[1] ?? bestDriver[0]),
    pick('chassis', maxRating(pool.chassis)),
    pick('engine', maxRating(pool.engines)),
    pick('teamPrincipal', maxRating(pool.teamPrincipals)),
    pick('engineerCrew', maxRating(pool.pitTeams)),
    pick('devBudget', maxRating(pool.devBudgets)),
    pick('reserveDriver', pool.reserves[0]),
  ]
}

describe('elite team balance', () => {
  const pack = loadPack(2007, 'mclaren')
  const grid = seasonPackToSimulationGrid(pack)
  const picks = elitePicks(pack)

  it('elite-rated dream team wins WCC with fixed seed', () => {
    const result = simulateSeason(grid, picks, 0)
    expect(result.wccPosition).toBe(1)
    expect(result.wdcPosition).toBeLessThanOrEqual(5)
  })

  it('elite team wins WCC in majority of random seeds', () => {
    let wins = 0
    const trials = 50
    for (let i = 0; i < trials; i++) {
      const result = simulateSeason(grid, picks, i * 137)
      if (result.wccPosition === 1) wins++
    }
    expect(wins).toBeGreaterThan(trials * 0.7)
  })
})
