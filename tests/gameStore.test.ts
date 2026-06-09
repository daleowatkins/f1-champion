import { describe, it, expect, beforeEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import { useGameStore } from '../src/store/gameStore'
import type { DraftPick, SeasonPack } from '../src/types/game'

function loadPack(constructorId: string): SeasonPack {
  const filePath = path.join(
    process.cwd(),
    `public/data/seasons/2025/${constructorId}.json`,
  )
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

function fullPicks(pack: SeasonPack): DraftPick[] {
  const pool = pack.draftPool
  const withSource = (slot: DraftPick['slot'], option: DraftPick['option']): DraftPick => ({
    slot,
    option,
    sourceConstructorId: pack.constructorId,
    sourceConstructorName: pack.constructorName,
    sourceYear: pack.year,
    historicalWccPosition: pack.historicalWccPosition,
  })
  return [
    withSource('driver1', pool.drivers[0]),
    withSource('driver2', pool.drivers[1] ?? pool.drivers[0]),
    withSource('chassis', pool.chassis[0]),
    withSource('engine', pool.engines[0]),
    withSource('teamPrincipal', pool.teamPrincipals[0]),
    withSource('engineerCrew', pool.pitTeams[0]),
    withSource('devBudget', pool.devBudgets[0]),
    withSource('reserveDriver', pool.reserves[0]),
  ]
}

describe('gameStore beginSimulation', () => {
  beforeEach(() => {
    useGameStore.getState().reset()
  })

  it('deduplicates concurrent beginSimulation calls', async () => {
    const pack = loadPack('ferrari')
    useGameStore.setState({
      phase: 'draft',
      driverPriority: 'equal',
      picks: fullPicks(pack),
    })

    const store = useGameStore.getState()
    await Promise.all([store.beginSimulation(), store.beginSimulation()])

    const state = useGameStore.getState()
    expect(state.phase).toBe('simulate')
    expect(state.simulationError).toBeNull()
  })

  it('starts the 2026 season after a full draft', async () => {
    const pack = loadPack('mclaren')
    useGameStore.setState({
      phase: 'draft',
      driverPriority: 'equal',
      picks: fullPicks(pack),
      simulationGrid: null,
    })

    await useGameStore.getState().beginSimulation()

    const state = useGameStore.getState()
    expect(state.simulationError).toBeNull()
    expect(state.phase).toBe('simulate')
    expect(state.result).not.toBeNull()
    expect(state.result?.raceResults).toHaveLength(24)
    expect(state.simulationGrid?.year).toBe(2026)
  })
})
