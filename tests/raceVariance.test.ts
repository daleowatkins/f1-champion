import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { simulateSeason } from '../src/engine/simulateSeason'
import type { DraftPick, DraftOption, SeasonPack, SimulationGrid } from '../src/types/game'

function loadGrid(): SimulationGrid {
  return JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'src/data/grid-2026.json'), 'utf-8'),
  )
}

function loadPack(): SeasonPack {
  return JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'public/data/seasons/2025/mclaren.json'), 'utf-8'),
  )
}

function driverOption(id: string, name: string, rating: number): DraftOption {
  return { id, name, rating }
}

function closeDriverPicks(pack: SeasonPack): DraftPick[] {
  const pool = pack.draftPool
  const withSource = (slot: DraftPick['slot'], option: DraftOption): DraftPick => ({
    slot,
    option,
    sourceConstructorId: pack.constructorId,
    sourceConstructorName: pack.constructorName,
    sourceYear: pack.year,
  })

  return [
    withSource('driver1', driverOption('test-d1', 'Test Driver A', 82)),
    withSource('driver2', driverOption('test-d2', 'Test Driver B', 79)),
    withSource('chassis', pool.chassis[0]),
    withSource('engine', pool.engines[0]),
    withSource('teamPrincipal', pool.teamPrincipals[0]),
    withSource('engineerCrew', pool.pitTeams[0]),
    withSource('devBudget', pool.devBudgets[0]),
    withSource('reserveDriver', pool.reserves[0]),
  ]
}

describe('race variance', () => {
  it('a slightly stronger driver does not beat their teammate every race', () => {
    const grid = loadGrid()
    const pack = loadPack()
    const result = simulateSeason(grid, closeDriverPicks(pack), 4242)

    let d1Ahead = 0
    let comparableRaces = 0
    for (const race of result.raceResults) {
      if (
        typeof race.driver1Position === 'number' &&
        typeof race.driver2Position === 'number'
      ) {
        comparableRaces++
        if (race.driver1Position < race.driver2Position) d1Ahead++
      }
    }

    expect(comparableRaces).toBeGreaterThan(0)
    expect(d1Ahead).toBeGreaterThan(0)
    expect(d1Ahead).toBeLessThan(comparableRaces)
  })
})
