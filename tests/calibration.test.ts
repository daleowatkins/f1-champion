import { describe, it, expect } from 'vitest'
import { seasonPackToSimulationGrid, simulateSeason } from '../src/engine/simulateSeason'
import type { DraftPick, SeasonPack } from '../src/types/game'
import fs from 'fs'
import path from 'path'

function loadPack(year: number, constructorId: string): SeasonPack {
  const filePath = path.join(process.cwd(), 'public/data/seasons', String(year), `${constructorId}.json`)
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

function autoBestDraft(pack: SeasonPack): DraftPick[] {
  const pool = pack.draftPool
  const sortedDrivers = [...pool.drivers].sort((a, b) => b.rating - a.rating)
  const sortBest = <T extends { rating: number }>(arr: T[]) => [...arr].sort((a, b) => b.rating - a.rating)[0]
  return [
    withSource(pack, 'driver1', sortedDrivers[0]),
    withSource(pack, 'driver2', sortedDrivers[1] ?? sortedDrivers[0]),
    withSource(pack, 'chassis', sortBest(pool.chassis)),
    withSource(pack, 'engine', sortBest(pool.engines)),
    withSource(pack, 'teamPrincipal', sortBest(pool.teamPrincipals)),
    withSource(pack, 'engineerCrew', sortBest(pool.pitTeams)),
    withSource(pack, 'devBudget', sortBest(pool.devBudgets)),
    withSource(pack, 'reserveDriver', pool.reserves[0]),
  ]
}

const calibrationSeasons = [
  { year: 2004, constructorId: 'mclaren' },
  { year: 1988, constructorId: 'mclaren' },
  { year: 2021, constructorId: 'mercedes' },
  { year: 1958, constructorId: 'vanwall' },
]

describe('calibration across eras', () => {
  for (const { year, constructorId } of calibrationSeasons) {
    it(`${constructorId} ${year} best draft within ±3 of historical WCC`, () => {
      const pack = loadPack(year, constructorId)
      const grid = seasonPackToSimulationGrid(pack)
      const result = simulateSeason(grid, autoBestDraft(pack), 42)
      expect(Math.abs(result.wccPosition - pack.historicalWccPosition)).toBeLessThanOrEqual(3)
    })
  }
})
