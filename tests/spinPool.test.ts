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

const vanwallYears: SpinEntry[] = [
  { id: 'vanwall-1953', constructorId: 'vanwall', constructorName: 'Vanwall', year: 1953, weight: 8 },
  { id: 'vanwall-1954', constructorId: 'vanwall', constructorName: 'Vanwall', year: 1954, weight: 10 },
  { id: 'vanwall-1955', constructorId: 'vanwall', constructorName: 'Vanwall', year: 1955, weight: 12 },
  { id: 'ferrari-1955', constructorId: 'ferrari', constructorName: 'Ferrari', year: 1955, weight: 14 },
  { id: 'maserati-1955', constructorId: 'maserati', constructorName: 'Maserati', year: 1955, weight: 6 },
]

describe('spinPool exclusion', () => {
  it('uses constructor-year as the roll key', () => {
    expect(spinEntryKey(entries[0])).toBe('a-2000')
  })

  it('never returns an excluded team-year on respin', () => {
    const excluded = new Set(['a-2000'])
    for (let i = 0; i < 20; i++) {
      const pick = pickRandomSpin(entries, Math.random, { excludedKeys: excluded })
      expect(spinEntryKey(pick)).not.toBe('a-2000')
    }
  })

  it('excludes the whole constructor during respins at the same slot', () => {
    const excludedConstructors = new Set(['vanwall'])
    for (let i = 0; i < 30; i++) {
      const pick = pickRandomSpin(vanwallYears, Math.random, {
        excludedConstructorIds: excludedConstructors,
      })
      expect(pick.constructorId).not.toBe('vanwall')
    }
  })

  it('favours stronger seasons by roughly 20%', () => {
    const pool: SpinEntry[] = [
      { id: 'weak-2010', constructorId: 'weak', constructorName: 'Weak', year: 2010, weight: 1 },
      { id: 'strong-2010', constructorId: 'strong', constructorName: 'Strong', year: 2010, weight: 11 },
    ]
    let strong = 0
    const trials = 5000
    for (let i = 0; i < trials; i++) {
      if (pickRandomSpin(pool, Math.random).constructorId === 'strong') strong++
    }
    const strongRate = strong / trials
    expect(strongRate).toBeGreaterThan(0.82)
    expect(strongRate).toBeLessThan(0.98)
  })

  it('keeps seeded first spins deterministic', () => {
    const runSeed = 424242
    const first = pickSpinWithRand(entries, seededRandom(deriveSeed(runSeed, 'spin-0-r0')))
    const again = pickSpinWithRand(entries, seededRandom(deriveSeed(runSeed, 'spin-0-r0')))
    expect(spinEntryKey(first)).toBe(spinEntryKey(again))
  })

  it('filters the available pool', () => {
    const pool = availableSpinEntries(entries, new Set(['b-2001', 'c-2002']))
    expect(pool).toHaveLength(1)
    expect(pool[0].constructorId).toBe('a')
  })
})
