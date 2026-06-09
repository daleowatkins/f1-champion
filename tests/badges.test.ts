import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import {
  resolveComponentBadge,
  resolveDriverBadge,
  resolveOptionBadge,
  type DraftBadgeData,
} from '../src/engine/badges'

const stubBadges: DraftBadgeData = {
  driverPrimeYears: {
    'lewis-hamilton': [2020, 2021],
    'max-verstappen': [2023],
  },
  legend: {
    chassis: ['mclaren-mcl39', 'red-bull-rb20'],
    engines: ['mercedes-amg-f1-m16-16-v6-t-h'],
  },
}

describe('draft badges', () => {
  it('marks a driver prime year', () => {
    expect(
      resolveDriverBadge({ id: 'lewis-hamilton', name: 'Lewis', rating: 95 }, 2020, stubBadges),
    ).toBe('prime')
    expect(
      resolveDriverBadge({ id: 'lewis-hamilton', name: 'Lewis', rating: 79 }, 2026, stubBadges),
    ).toBeNull()
  })

  it('marks legend chassis and engines', () => {
    expect(
      resolveComponentBadge({ id: 'mclaren-mcl39', name: 'MCL39', rating: 88 }, 'chassis', stubBadges),
    ).toBe('legend')
    expect(
      resolveComponentBadge(
        { id: 'mercedes-amg-f1-m16-16-v6-t-h', name: 'PU', rating: 88 },
        'engine',
        stubBadges,
      ),
    ).toBe('legend')
    expect(
      resolveComponentBadge({ id: 'alpine-a525', name: 'A525', rating: 40 }, 'chassis', stubBadges),
    ).toBeNull()
  })

  it('built badge data only grants prime to drivers with 5+ seasons', () => {
    const badges = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'src/data/draft-badges.json'), 'utf-8'),
    ) as DraftBadgeData

    expect(badges.driverPrimeYears['lewis-hamilton']).toContain(2020)
    expect(badges.driverPrimeYears['oscar-piastri']).toBeUndefined()
    expect(badges.driverPrimeYears['isack-hadjar']).toBeUndefined()
  })

  it('routes slot types through resolveOptionBadge', () => {
    expect(
      resolveOptionBadge(
        { id: 'max-verstappen', name: 'Max', rating: 99 },
        'driver1',
        2023,
        stubBadges,
      ),
    ).toBe('prime')
    expect(
      resolveOptionBadge(
        { id: 'red-bull-rb20', name: 'RB20', rating: 90 },
        'chassis',
        2024,
        stubBadges,
      ),
    ).toBe('legend')
  })
})
