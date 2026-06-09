import { describe, it, expect } from 'vitest'
import {
  blendDriverRating,
  blendWithCareerPeak,
  buildYearRatingContext,
  calibrateDriverOvr,
  computeDriverRatingsForTeam,
  computeSeasonForm,
  driverSeasonScore,
  finalizeYearDriverRatings,
  isGoatDriver,
  percentileRating,
  softEliteCeiling,
  teammateDeltaToAdjustment,
  type DriverRatingBreakdown,
} from '../scripts/driver-ratings'

const GRID_2025 = [394, 389, 381, 289, 225, 135, 135, 70, 50, 30]

describe('driverRatings', () => {
  it('percentileRating maps grid position to 30-99', () => {
    expect(percentileRating(100, [10, 20, 50, 100])).toBeGreaterThan(80)
    expect(percentileRating(5, [10, 20, 50, 100])).toBeLessThan(50)
  })

  it('soft elite ceiling only narrows title fight drivers', () => {
    expect(softEliteCeiling(394, 394)).toBe(99)
    expect(softEliteCeiling(389, 394)).toBe(99)
    expect(softEliteCeiling(381, 394)).toBe(97)
    expect(softEliteCeiling(225, 394)).toBe(99)
    expect(softEliteCeiling(16, 394)).toBe(99)
  })

  it('teammate delta works with low point totals (backmarker teams)', () => {
    expect(teammateDeltaToAdjustment(9, 7)).toBeGreaterThan(8)
    expect(teammateDeltaToAdjustment(5, 34)).toBeLessThanOrEqual(2)
  })

  it('car-aware season form lifts weak-car outperformers', () => {
    const yearMax = driverSeasonScore(394, 7)
    const form = computeSeasonForm(16, 0, yearMax, GRID_2025, {
      leaderPoints: 394,
      teamStrengthPct: 0.3,
      teammateTalent: 92,
    })
    expect(form).toBeGreaterThanOrEqual(70)
  })

  it('career blend has no hard points cap', () => {
    expect(blendWithCareerPeak(98, 99, 8)).toBeGreaterThanOrEqual(95)
    expect(blendWithCareerPeak(44, 99, 5)).toBeGreaterThanOrEqual(80)
  })

  it('rates williams russell highly when he dominates a weak teammate', () => {
    const yearMax = driverSeasonScore(395, 11)
    const grid = [395, 380, 300, 250, 200, 180, 150, 120, 100, 80, 60, 40, 30, 20, 16, 10, 7, 5]
    const entries = [
      { driverId: 'rus', constructorId: 'williams', points: 16, wins: 0, raceStarts: 22 },
      { driverId: 'lat', constructorId: 'williams', points: 7, wins: 0, raceStarts: 22 },
    ]
    const ctx = buildYearRatingContext(
      entries,
      {
        williams: 23,
        mercedes: 500,
        mclaren: 400,
        ferrari: 300,
        alpine: 150,
        'red-bull': 450,
      },
      395,
    )
    const map = computeDriverRatingsForTeam(
      entries,
      yearMax,
      { rus: 'Russell', lat: 'Latifi' },
      new Map([['rus', 68], ['lat', 35]]),
      new Map([['rus', 3], ['lat', 2]]),
      grid,
      ctx,
    )
    expect(map.get('rus')!.computedRating).toBeGreaterThanOrEqual(82)
    expect(map.get('rus')!.computedRating).toBeLessThanOrEqual(95)
  })

  it('2025 WDC norris tops verstappen but stays below GOAT elite tier', () => {
    const yearMax = driverSeasonScore(394, 7)
    const mclaren = [
      { driverId: 'lando-norris', constructorId: 'mclaren', points: 394, wins: 7, raceStarts: 24 },
      { driverId: 'oscar-piastri', constructorId: 'mclaren', points: 381, wins: 7, raceStarts: 24 },
    ]
    const redBull = [
      { driverId: 'max-verstappen', constructorId: 'red-bull', points: 389, wins: 8, raceStarts: 24 },
      { driverId: 'liam-lawson', constructorId: 'red-bull', points: 38, wins: 0, raceStarts: 24 },
    ]
    const ferrari = [
      { driverId: 'lec', constructorId: 'ferrari', points: 225, wins: 0, raceStarts: 24 },
      { driverId: 'ham', constructorId: 'ferrari', points: 135, wins: 0, raceStarts: 24 },
    ]
    const entries = [...mclaren, ...redBull, ...ferrari]
    const ctx = buildYearRatingContext(
      entries,
      { mclaren: 775, 'red-bull': 427, ferrari: 360 },
      394,
    )
    const peaks = new Map(entries.map((e) => [e.driverId, 95]))
    const seasons = new Map(entries.map((e) => [e.driverId, 6]))
    const names = {
      'lando-norris': 'Norris',
      'oscar-piastri': 'Piastri',
      'max-verstappen': 'Verstappen',
      'liam-lawson': 'Lawson',
      lec: 'Leclerc',
      'lewis-hamilton': 'Hamilton',
    }

    const ratings = new Map<string, DriverRatingBreakdown>()
    for (const team of [mclaren, redBull, ferrari]) {
      const teamMap = computeDriverRatingsForTeam(
        team,
        yearMax,
        names,
        peaks,
        seasons,
        GRID_2025,
        ctx,
      )
      for (const [id, breakdown] of teamMap) ratings.set(id, breakdown)
    }

    finalizeYearDriverRatings(
      entries.map((e) => ({ driverId: e.driverId, points: e.points, wins: e.wins })),
      ratings,
      yearMax,
      GRID_2025,
    )

    const norRaw = ratings.get('lando-norris')!
    const verRaw = ratings.get('max-verstappen')!
    expect(norRaw.computedRating).toBeGreaterThan(verRaw.computedRating)
    expect(isGoatDriver('lando-norris')).toBe(false)
    expect(isGoatDriver('max-verstappen')).toBe(true)

    const nor = calibrateDriverOvr('lando-norris', norRaw.computedRating, {
      seasonForm: norRaw.seasonForm,
      careerPeakToDate: norRaw.careerPeakToDate,
      isPointsLeader: true,
    })
    const ver = calibrateDriverOvr('max-verstappen', verRaw.computedRating, {
      seasonForm: verRaw.seasonForm,
      careerPeakToDate: verRaw.careerPeakToDate,
      isPointsLeader: false,
    })

    expect(nor).toBeLessThanOrEqual(88)
    expect(ver).toBeGreaterThan(nor - 8)
    expect(ver).toBeLessThanOrEqual(94)
  })

  it('GOAT peak years can reach 94 OVR, weak years stay much lower', () => {
    expect(
      calibrateDriverOvr('michael-schumacher', 99, {
        seasonForm: 99,
        careerPeakToDate: 99,
        isPointsLeader: true,
      }),
    ).toBe(94)

    expect(
      calibrateDriverOvr('michael-schumacher', 85, {
        seasonForm: 52,
        careerPeakToDate: 99,
        isPointsLeader: false,
      }),
    ).toBeLessThanOrEqual(80)
  })

  it('rates WDC winner highly (1984 Lauda/Prost)', () => {
    const yearMax = driverSeasonScore(72, 5)
    const grid = [72, 71.5, 40, 30]
    const entries = [
      { driverId: 'niki-lauda', constructorId: 'mclaren', points: 72, wins: 5, raceStarts: 16 },
      { driverId: 'alain-prost', constructorId: 'mclaren', points: 71.5, wins: 7, raceStarts: 16 },
    ]
    const ctx = buildYearRatingContext(entries, { mclaren: 143.5 })
    const map = computeDriverRatingsForTeam(
      entries,
      yearMax,
      { 'niki-lauda': 'Lauda', 'alain-prost': 'Prost' },
      new Map([
        ['niki-lauda', 90],
        ['alain-prost', 90],
      ]),
      new Map([
        ['niki-lauda', 10],
        ['alain-prost', 8],
      ]),
      grid,
      ctx,
    )
    finalizeYearDriverRatings(
      entries.map((e) => ({ driverId: e.driverId, points: e.points, wins: e.wins })),
      map,
      yearMax,
      grid,
    )
    const lauda = map.get('niki-lauda') ?? map.get('lauda')!
    const prost = map.get('alain-prost') ?? map.get('prost')!
    expect(lauda.computedRating).toBeGreaterThan(prost.computedRating)

    const laudaOvr = calibrateDriverOvr('niki-lauda', lauda.computedRating, {
      seasonForm: lauda.seasonForm,
      careerPeakToDate: lauda.careerPeakToDate,
      isPointsLeader: true,
    })
    expect(laudaOvr).toBeGreaterThanOrEqual(88)
  })

  it('skips teammate penalty for rookies with small teammate gaps', () => {
    const adjusted = blendDriverRating(80, -150, 289, 24, true, 1)
    expect(adjusted).toBe(80)
  })
})
