import { describe, it, expect } from 'vitest'
import {
  availableSpinEntries,
  pickRandomSpin,
  spinEntryKey,
} from '../src/engine/spinPool'
import type { SpinEntry } from '../src/types/game'
import { deriveSeed, pickSpinWithRand, seededRandom } from '../src/lib/runSeed'

const entries: SpinEntry[] = [
  { id: 'a-2000', constructorId: 'a', constructorName: 'A', year: 2000, weight: 1 },
  { id: 'b-2001', constructorId: 'b', constructorName: 'B', year: 2001, weight: 1 },
  { id: 'c-2002', constructorId: 'c', constructorName: 'C', year: 2002, weight: 1 },
]

describe('spinPool exclusion', () => {
  it('uses constructor-year as the roll key', () => {
    expect(spinEntryKey(entries[0])).toBe('a-2000')
  })

  it('never returns an excluded team on respin', () => {
    const excluded = new Set(['a-2000'])
    for (let i = 0; i < 20; i++) {
      const pick = pickRandomSpin(entries, Math.random, excluded)
      expect(pick.constructorId).not.toBe('a')
    }
  })

  it('keeps seeded respins off previously rolled teams', () => {
    const runSeed = 424242
    const first = pickSpinWithRand(entries, seededRandom(deriveSeed(runSeed, 'spin-0-r0')))
    const excluded = new Set([spinEntryKey(first)])
    const second = pickSpinWithRand(
      entries,
      seededRandom(deriveSeed(runSeed, 'spin-0-r1')),
      excluded,
    )
    expect(spinEntryKey(second)).not.toBe(spinEntryKey(first))
  })

  it('filters the available pool', () => {
    const pool = availableSpinEntries(entries, new Set(['b-2001', 'c-2002']))
    expect(pool).toHaveLength(1)
    expect(pool[0].constructorId).toBe('a')
  })
})
