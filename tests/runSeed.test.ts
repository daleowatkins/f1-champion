import { describe, it, expect } from 'vitest'
import { buildChallengeShareContent, formatShareUrl } from '../src/lib/runSeed'

describe('runSeed share', () => {
  it('builds a challenge invite with seed link', () => {
    const url = formatShareUrl(123456, { mode: 'classic' })
    const share = buildChallengeShareContent({
      tierLabel: 'Constructors Champion',
      year: 2026,
      wccPosition: 1,
      bestWdcPosition: 2,
      totalPoints: 500,
      wins: 8,
      runSeed: 123456,
      seedUrl: url,
    })

    expect(share.title).toContain('Beat my')
    expect(share.text).toContain('Think you can beat my')
    expect(share.text).toContain('P1 WCC')
    expect(share.text).toContain('123456')
    expect(share.text).toContain(url)
    expect(share.url).toBe(url)
  })
})
