import { describe, it, expect } from 'vitest'
import { banditJackpotChance, pickRandomPerk, spinBandit } from '../src/engine/bandit'

describe('bandit', () => {
  it('awards a perk when all three reels are trophies', () => {
    let n = 0
    const rand = () => {
      const seq = [0.1, 0.1, 0.1, 0]
      return seq[n++ % seq.length]
    }
    const result = spinBandit(rand)
    expect(result.reels).toEqual(['trophy', 'trophy', 'trophy'])
    expect(result.won).toBe(true)
    expect(result.perk).toBe('flawless-engineering')
  })

  it('does not award a perk without three trophies', () => {
    let n = 0
    const rand = () => {
      const seq = [0.1, 0.9, 0.1]
      return seq[n++ % seq.length]
    }
    const result = spinBandit(rand)
    expect(result.won).toBe(false)
    expect(result.perk).toBeNull()
  })

  it('targets about a 1-in-5 jackpot chance', () => {
    expect(banditJackpotChance()).toBeCloseTo(0.2, 5)
  })

  it('picks perks from the defined set', () => {
    const perks = new Set(
      Array.from({ length: 40 }, (_, i) => pickRandomPerk(() => i / 40)),
    )
    expect(perks.size).toBeGreaterThan(1)
    for (const perk of perks) {
      expect([
        'flawless-engineering',
        'huge-sponsor',
        'creative-rules',
        'driver-wellbeing',
      ]).toContain(perk)
    }
  })
})
