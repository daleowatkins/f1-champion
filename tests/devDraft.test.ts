import { describe, it, expect } from 'vitest'
import { autoFillBest, selectionToPicks, type SlotSource } from '../src/engine/devDraft'
import type { DraftPool, SeasonPack, SlotType } from '../src/types/game'
import { SLOT_ORDER } from '../src/types/game'

function stubPack(
  year: number,
  constructorId: string,
  pool: Partial<DraftPool>,
): SeasonPack {
  return {
    id: `${constructorId}-${year}`,
    constructorId,
    constructorName: constructorId,
    year,
    raceCount: 10,
    calendar: [],
    draftPool: {
      drivers: [],
      chassis: [],
      engines: [],
      teamPrincipals: [],
      pitTeams: [],
      devBudgets: [],
      reserves: [],
      ...pool,
    },
    opponents: [],
    historicalWccPosition: 1,
  }
}

describe('devDraft', () => {
  it('auto-fills highest rated unique drivers', () => {
    const source: SlotSource = { year: 2020, constructorId: 'mclaren' }
    const sources = Object.fromEntries(
      SLOT_ORDER.map((slot) => [slot, source]),
    ) as Record<SlotType, SlotSource>

    const pack = stubPack(2020, 'mclaren', {
      drivers: [
        { id: 'd-low', name: 'Low', rating: 70 },
        { id: 'd-high', name: 'High', rating: 90 },
        { id: 'd-mid', name: 'Mid', rating: 80 },
      ],
      chassis: [{ id: 'c1', name: 'Car', rating: 88 }],
      engines: [{ id: 'e1', name: 'Engine', rating: 85 }],
      teamPrincipals: [{ id: 'tp1', name: 'Boss', rating: 75 }],
      pitTeams: [{ id: 'p1', name: 'Pit', rating: 72 }],
      devBudgets: [{ id: 'db1', name: 'Budget', rating: 70 }],
      reserves: [{ id: 'r1', name: 'Reserve', rating: 60 }],
    })

    const selection = autoFillBest(sources, { '2020/mclaren': pack })
    expect(selection.driver1).toBe('d-high')
    expect(selection.driver2).toBe('d-mid')
    expect(selection.reserveDriver).toBe('r1')

    const picks = selectionToPicks(selection, sources, { '2020/mclaren': pack })
    expect(picks).toHaveLength(8)
  })
})
