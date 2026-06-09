export function percentileRating(value: number, allValues: number[]): number {
  if (allValues.length === 0) return 50
  const sorted = [...allValues].sort((a, b) => a - b)
  const rank = sorted.filter((v) => v <= value).length
  return Math.max(30, Math.min(99, Math.round((rank / sorted.length) * 69 + 30)))
}

/** Points dominate; wins only break ties (1 win ≈ 0.1 pts). */
export function driverSeasonScore(points: number, wins: number): number {
  return points + wins * 0.1
}

/** Soft ceiling for title contenders — only narrows the very top, not backmarkers. */
export function softEliteCeiling(points: number, leaderPoints: number): number {
  if (leaderPoints <= 0 || points <= leaderPoints * 0.75) return 99
  const ratio = points / leaderPoints
  if (ratio >= 0.98) return 99
  if (ratio >= 0.94) return 97
  if (ratio >= 0.88) return 95
  if (ratio >= 0.82) return 93
  return 99
}

export function teammateBeatRatio(delta: number, baseline: number): number {
  return delta / Math.max(baseline, 3)
}

export function computeResultsForm(
  points: number,
  wins: number,
  yearMaxScore: number,
  allYearPoints: number[] = [],
): number {
  if (yearMaxScore <= 0) return 50
  const score = driverSeasonScore(points, wins)
  let form = Math.max(30, Math.min(99, Math.round(30 + (score / yearMaxScore) * 69)))

  if (allYearPoints.length >= 4) {
    const pctForm = percentileRating(points, allYearPoints)
    form = Math.round(form * 0.5 + pctForm * 0.5)
  }

  if (points >= 130) form = Math.min(99, form + 4)
  else if (points >= 100) form = Math.min(99, form + 2)

  return Math.max(30, Math.min(99, form))
}

/**
 * Season form blends raw results with teammate talent when the car is weak.
 * Elite soft ceiling only applies to drivers within ~75% of the points leader.
 */
export function computeSeasonForm(
  points: number,
  wins: number,
  yearMaxScore: number,
  allYearPoints: number[] = [],
  opts?: {
    leaderPoints?: number
    teamStrengthPct?: number
    teammateTalent?: number | null
  },
): number {
  let form = computeResultsForm(points, wins, yearMaxScore, allYearPoints)

  const leaderPoints = opts?.leaderPoints ?? (allYearPoints.length ? Math.max(...allYearPoints) : points)
  form = Math.min(form, softEliteCeiling(points, leaderPoints))

  const isChampionshipTier =
    leaderPoints > 0 && points >= leaderPoints * 0.9

  // Teammate talent only lifts drivers held back by weak machinery — not WDC contenders.
  if (
    opts?.teammateTalent != null &&
    opts.teamStrengthPct != null &&
    !isChampionshipTier
  ) {
    const weakness = 1 - opts.teamStrengthPct
    const talentWeight = Math.min(0.85, 0.2 + weakness * 0.75)
    form = Math.round(form * (1 - talentWeight) + opts.teammateTalent * talentWeight)
  }

  return Math.max(30, Math.min(99, form))
}

export interface DriverSeasonInput {
  driverId: string
  constructorId: string
  points: number
  wins: number
  raceStarts: number
}

export interface YearRatingContext {
  leaderPoints: number
  teamStrengthByConstructor: Map<string, number>
  teammateContextByDriver: Map<
    string,
    { beatRatio: number; deltaPercentile: number; teammateTalent: number }
  >
}

export interface DriverRatingBreakdown {
  seasonForm: number
  yearPerformance: number
  careerPeakToDate: number
  seasonsToDate: number
  pointsTierCap: number
  teammateDelta: number | null
  teammateBaseline: number | null
  teammateNames: string[]
  deltaPercentile: number | null
  computedRating: number
  raceStarts: number
}

export function buildYearRatingContext(
  entries: DriverSeasonInput[],
  teamPointsByConstructor: Record<string, number>,
  yearLeaderPoints?: number,
): YearRatingContext {
  const allTeamPoints = Object.values(teamPointsByConstructor)
  const teamStrengthByConstructor = new Map<string, number>()
  for (const [id, pts] of Object.entries(teamPointsByConstructor)) {
    teamStrengthByConstructor.set(id, percentileRating(pts, allTeamPoints) / 99)
  }

  const byTeam = new Map<string, DriverSeasonInput[]>()
  for (const entry of entries) {
    const list = byTeam.get(entry.constructorId) ?? []
    list.push(entry)
    byTeam.set(entry.constructorId, list)
  }

  const beatRatioByDriver = new Map<string, number>()
  for (const teamEntries of byTeam.values()) {
    if (teamEntries.length < 2) continue
    for (const entry of teamEntries) {
      const others = teamEntries.filter((t) => t.driverId !== entry.driverId)
      const baseline = others.reduce((sum, t) => sum + t.points, 0) / others.length
      beatRatioByDriver.set(entry.driverId, teammateBeatRatio(entry.points - baseline, baseline))
    }
  }

  const allRatios = [...beatRatioByDriver.values()]
  const teammateContextByDriver = new Map<
    string,
    { beatRatio: number; deltaPercentile: number; teammateTalent: number }
  >()
  for (const [driverId, ratio] of beatRatioByDriver) {
    const talent = percentileRating(ratio, allRatios)
    teammateContextByDriver.set(driverId, {
      beatRatio: ratio,
      deltaPercentile: talent,
      teammateTalent: talent,
    })
  }

  return {
    leaderPoints:
      yearLeaderPoints ?? Math.max(...entries.map((e) => e.points), 0),
    teamStrengthByConstructor,
    teammateContextByDriver,
  }
}

/** More year weight early in career; veterans lean on proven peak. */
export function blendWithCareerPeak(
  yearPerformance: number,
  careerPeakToDate: number,
  seasonsToDate: number,
): number {
  let yearWeight = seasonsToDate <= 1 ? 0.82 : seasonsToDate === 2 ? 0.58 : 0.35
  if (yearPerformance > careerPeakToDate + 12) {
    yearWeight = Math.min(0.88, yearWeight + 0.25)
  }
  const careerWeight = 1 - yearWeight
  const blended = Math.round(yearPerformance * yearWeight + careerPeakToDate * careerWeight)
  return Math.max(30, Math.min(99, blended))
}

export function computeDriverRatingsForTeam(
  entries: DriverSeasonInput[],
  yearMaxScore: number,
  nameByDriverId: Record<string, string>,
  careerPeakToDate: Map<string, number>,
  driverSeasonsToDate: Map<string, number>,
  allYearPoints: number[],
  ratingContext?: YearRatingContext,
): Map<string, DriverRatingBreakdown> {
  const deltaByDriver = new Map<
    string,
    { delta: number; baseline: number; teammateNames: string[] }
  >()

  if (entries.length > 1) {
    for (const entry of entries) {
      const others = entries.filter((t) => t.driverId !== entry.driverId)
      const baseline = others.reduce((sum, t) => sum + t.points, 0) / others.length
      const delta = entry.points - baseline
      deltaByDriver.set(entry.driverId, {
        delta,
        baseline,
        teammateNames: others.map((t) => nameByDriverId[t.driverId] ?? t.driverId),
      })
    }
  }

  const result = new Map<string, DriverRatingBreakdown>()

  for (const entry of entries) {
    const seasonsToDate = driverSeasonsToDate.get(entry.driverId) ?? 1
    const teammate = deltaByDriver.get(entry.driverId)
    const teamStrengthPct =
      ratingContext?.teamStrengthByConstructor.get(entry.constructorId) ?? 0.5
    const teammateCtx = ratingContext?.teammateContextByDriver.get(entry.driverId)
    const talentBlended = teammateCtx !== undefined

    const seasonForm = computeSeasonForm(
      entry.points,
      entry.wins,
      yearMaxScore,
      allYearPoints,
      {
        leaderPoints: ratingContext?.leaderPoints,
        teamStrengthPct,
        teammateTalent: teammateCtx?.teammateTalent ?? null,
      },
    )

    const yearPerformance = blendDriverRating(
      seasonForm,
      teammate?.delta ?? null,
      teammate?.baseline ?? null,
      entry.raceStarts,
      teammate !== undefined,
      seasonsToDate,
      talentBlended,
    )

    const storedPeak = careerPeakToDate.get(entry.driverId)
    const peak = storedPeak !== undefined && storedPeak > 0 ? storedPeak : seasonForm
    let computedRating = blendWithCareerPeak(yearPerformance, peak, seasonsToDate)

    if (yearPerformance > computedRating + 8 && yearPerformance > peak + 18) {
      computedRating = Math.round(yearPerformance * 0.85 + computedRating * 0.15)
    }

    // Weak car masked talent: tiny points share but elite teammate dominance.
    const leaderPoints = ratingContext?.leaderPoints ?? entry.points
    const isChampionshipTier =
      leaderPoints > 0 && entry.points >= leaderPoints * 0.9
    const carLimitedByResults =
      leaderPoints > 0 && entry.points <= leaderPoints * 0.08
    if (
      teammateCtx &&
      !isChampionshipTier &&
      carLimitedByResults &&
      teammateCtx.deltaPercentile >= 85 &&
      teammateCtx.teammateTalent > yearPerformance
    ) {
      const carLimited = Math.round(yearPerformance * 0.35 + teammateCtx.teammateTalent * 0.65)
      computedRating = Math.max(computedRating, carLimited)
    }

    const eliteCeiling = softEliteCeiling(entry.points, ratingContext?.leaderPoints ?? entry.points)

    result.set(entry.driverId, {
      seasonForm,
      yearPerformance,
      careerPeakToDate: peak,
      seasonsToDate,
      pointsTierCap: eliteCeiling,
      teammateDelta: teammate?.delta ?? null,
      teammateBaseline: teammate?.baseline ?? null,
      teammateNames: teammate?.teammateNames ?? [],
      deltaPercentile: teammateCtx?.deltaPercentile ?? null,
      computedRating: Math.max(30, Math.min(99, computedRating)),
      raceStarts: entry.raceStarts,
    })
  }

  return result
}

export function teammateDeltaToAdjustment(delta: number, teammateBaseline?: number | null): number {
  const baseline = Math.max(teammateBaseline ?? 0, 3)
  const pct = delta / baseline
  if (Math.abs(pct) < 0.06) return 0
  const magnitude = Math.min(14, Math.round(Math.abs(pct) * 10))
  return delta > 0 ? magnitude : -magnitude
}

export function blendDriverRating(
  seasonForm: number,
  teammateDelta: number | null,
  teammateBaseline: number | null,
  raceStarts: number,
  hasTeammate: boolean,
  seasonsToDate: number,
  talentAlreadyInForm = false,
): number {
  if (!hasTeammate || teammateDelta === null) {
    return seasonForm
  }

  if (seasonsToDate <= 1) {
    return seasonForm
  }

  let deltaAdj = teammateDeltaToAdjustment(teammateDelta, teammateBaseline)
  if (talentAlreadyInForm) {
    deltaAdj = Math.round(deltaAdj * 0.35)
  }

  let rating = Math.max(30, Math.min(99, seasonForm + deltaAdj))

  if (raceStarts < 10) {
    const confidence = raceStarts / 10
    rating = Math.round(confidence * rating + (1 - confidence) * seasonForm)
  }

  return Math.max(30, Math.min(99, rating))
}

export interface YearDriverStanding {
  driverId: string
  points: number
  wins: number
}

/** The ten all-time greats — only they can reach the elite 90+ band (pre-shift). */
export const GOAT_DRIVER_IDS = new Set([
  'michael-schumacher',
  'lewis-hamilton',
  'max-verstappen',
  'sebastian-vettel',
  'juan-manuel-fangio',
  'ayrton-senna',
  'alain-prost',
  'niki-lauda',
  'jim-clark',
  'fernando-alonso',
])

export const DRIVER_OVR_SHIFT = 5
const NON_GOAT_CAP = 93
const GOAT_PEAK_CAP = 99
const GOAT_STRONG_CAP = 97
const GOAT_SOLID_CAP = 94

export function isGoatDriver(driverId: string): boolean {
  return GOAT_DRIVER_IDS.has(driverId)
}

export interface DriverOvrContext {
  seasonForm: number
  careerPeakToDate: number
  isPointsLeader?: boolean
}

function goatPreShiftCap(ctx: DriverOvrContext): number {
  const { seasonForm, careerPeakToDate, isPointsLeader } = ctx
  const nearCareerPeak =
    seasonForm >= careerPeakToDate * 0.96 && seasonForm >= 82
  const dominantSeason = !!isPointsLeader && seasonForm >= 88

  if (nearCareerPeak || dominantSeason) {
    if (seasonForm >= 96 || (isPointsLeader && seasonForm >= 92)) return GOAT_PEAK_CAP
    if (seasonForm >= 90) return GOAT_STRONG_CAP
    return GOAT_SOLID_CAP
  }

  if (seasonForm >= 78) return GOAT_SOLID_CAP - 2
  if (seasonForm >= 65) return 90
  return 86
}

/** Global OVR calibration: -5 shift, GOAT-only elite tier, peak years only for 99. */
export function calibrateDriverOvr(driverId: string, rating: number, ctx: DriverOvrContext): number {
  const tierCap = isGoatDriver(driverId) ? goatPreShiftCap(ctx) : NON_GOAT_CAP
  const shifted = Math.max(30, Math.min(tierCap, rating) - DRIVER_OVR_SHIFT)
  return shifted
}

/** Enforce championship order: points leader is top-rated; only GOATs can reach 99 pre-shift. */
export function finalizeYearDriverRatings(
  standings: YearDriverStanding[],
  ratings: Map<string, DriverRatingBreakdown>,
  yearMaxScore: number,
  allYearPoints: number[],
): void {
  if (standings.length === 0) return

  const sorted = [...standings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    return b.wins - a.wins
  })

  const leader = sorted[0]
  const leaderBreakdown = ratings.get(leader.driverId)
  if (!leaderBreakdown) return

  const leaderResults = computeResultsForm(
    leader.points,
    leader.wins,
    yearMaxScore,
    allYearPoints,
  )

  const leaderIsGoat = isGoatDriver(leader.driverId)
  let leaderRating = Math.max(leaderBreakdown.computedRating, leaderResults)
  leaderRating = Math.min(
    leaderIsGoat ? GOAT_PEAK_CAP : NON_GOAT_CAP,
    Math.max(leaderRating, leaderIsGoat ? 95 : 88),
  )
  leaderBreakdown.computedRating = leaderRating

  for (let i = 1; i < sorted.length; i++) {
    const entry = sorted[i]
    const breakdown = ratings.get(entry.driverId)
    if (!breakdown) continue

    const pointsGap = leader.points - entry.points
    const spread =
      pointsGap <= 5 ? 1 : pointsGap <= 15 ? 2 : pointsGap <= 40 ? 3 : pointsGap <= 80 ? 4 : 5
    const nonGoatCeiling = leaderIsGoat ? GOAT_STRONG_CAP : NON_GOAT_CAP - 1
    const maxRating = Math.min(nonGoatCeiling, leaderRating - spread)

    breakdown.computedRating = Math.min(breakdown.computedRating, maxRating)
  }
}

/** @deprecated Use softEliteCeiling — kept for tests during transition */
export function ratingCapForPoints(points: number, allYearPoints: number[]): number {
  const leader = Math.max(...allYearPoints, 0)
  return softEliteCeiling(points, leader)
}
