import { describe, it, expect } from 'vitest'
import {
  getAllAvailableOptionGroups,
  isSyntheticReserveOption,
  reserveDriverOptions,
} from '../src/engine/spinPool'
import type { DraftPick, DraftPool } from '../src/types/game'

const basePool: DraftPool = {
  drivers: [
    { id: 'max-verstappen', name: 'Max Verstappen', rating: 87 },
    { id: 'liam-lawson', name: 'Liam Lawson', rating: 43 },
  ],
  chassis: [{ id: 'rb21', name: 'RB21', rating: 87 }],
  engines: [{ id: 'honda', name: 'Honda PU', rating: 77 }],
  teamPrincipals: [{ id: 'tp', name: 'TP', rating: 80 }],
  pitTeams: [{ id: 'pit', name: 'Pit', rating: 90 }],
  devBudgets: [{ id: 'budget', name: 'Budget', rating: 70 }],
  reserves: [
    { id: 'reserve-red-bull-2026', name: 'Red Bull Reserve Driver', rating: 50 },
  ],
}

describe('reserveDriverOptions', () => {
  it('detects synthetic placeholder reserves', () => {
    expect(isSyntheticReserveOption({ id: 'reserve-ferrari-2020', name: 'X', rating: 40 })).toBe(
      true,
    )
    expect(isSyntheticReserveOption({ id: 'dino-beganovic', name: 'Dino Beganovic', rating: 50 })).toBe(
      false,
    )
  })

  it('prefers main lineup drivers over placeholder reserves', () => {
    const options = reserveDriverOptions(basePool, new Set())
    expect(options.map((o) => o.name)).toEqual(['Max Verstappen', 'Liam Lawson'])
  })

  it('excludes drivers already picked for race seats', () => {
    const options = reserveDriverOptions(basePool, new Set(['max-verstappen']))
    expect(options.map((o) => o.id)).toEqual(['liam-lawson'])
  })

  it('shows driver cards with a development button when reserve slot is open', () => {
    const picks: DraftPick[] = [
      {
        slot: 'driver1',
        option: { id: 'other-driver', name: 'Other', rating: 80 },
        sourceConstructorId: 'mclaren',
        sourceConstructorName: 'McLaren',
        sourceYear: 2025,
        historicalWccPosition: 2,
      },
      {
        slot: 'driver2',
        option: { id: 'other-driver-2', name: 'Other 2', rating: 78 },
        sourceConstructorId: 'ferrari',
        sourceConstructorName: 'Ferrari',
        sourceYear: 2024,
        historicalWccPosition: 2,
      },
    ]

    const groups = getAllAvailableOptionGroups(basePool, picks)
    const driverGroup = groups.find((g) => g.category === 'Drivers')
    expect(driverGroup?.driverOptions?.map((d) => d.option.name)).toEqual([
      'Max Verstappen',
      'Liam Lawson',
    ])
    expect(driverGroup?.driverOptions?.[0]?.availableSlots).toEqual(['reserveDriver'])
  })

  it('shows all three role buttons while race seats and development are open', () => {
    const groups = getAllAvailableOptionGroups(basePool, [])
    const driverGroup = groups.find((g) => g.category === 'Drivers')
    expect(driverGroup?.driverOptions?.[0]?.availableSlots).toEqual([
      'driver1',
      'driver2',
      'reserveDriver',
    ])
  })
})
