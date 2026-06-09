/**
 * F1DB splitted ingest — builds spin-index and per-season draft packs.
 * Run: npm run build:data
 */
import { execFileSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  buildYearRatingContext,
  computeDriverRatingsForTeam,
  computeSeasonForm,
  driverSeasonScore,
  calibrateDriverOvr,
  finalizeYearDriverRatings,
  percentileRating,
  type DriverRatingBreakdown,
  type YearRatingContext,
} from './driver-ratings'
import {
  calibrateChassisOvr,
  calibrateEngineOvr,
  isGoatEngine,
} from './component-ratings'
import {
  applyOverride,
  loadRatingOverrides,
  overrideKey,
  type AdminSlot,
  type RatingOverridesFile,
} from './rating-overrides'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const CACHE_DIR = path.join(ROOT, '.f1db-cache')
const OUT_DIR = path.join(ROOT, 'public', 'data')
const CURATED_TP = path.join(ROOT, 'data', 'curated', 'team-principals.json')

const YEAR_MIN = 1950
const YEAR_MAX = 2025

interface RatingBreakdown {
  seasonForm: number
  yearPerformance?: number
  careerPeakToDate?: number
  teammateDelta: number | null
  teammateBaseline: number | null
  teammateNames: string[]
  deltaPercentile: number | null
  computedRating: number
  raceStarts: number
  isOverridden: boolean
}

interface DraftOption {
  id: string
  name: string
  rating: number
  stats?: Record<string, number>
  meta?: string
  ratingBreakdown?: RatingBreakdown
}

interface TeamPrincipalEntry {
  constructorId: string
  year: number
  principals: { id: string; name: string; rating: number }[]
}

function loadJson<T>(name: string): T {
  const filePath = path.join(CACHE_DIR, name)
  if (!fs.existsSync(filePath)) throw new Error(`F1DB file not found: ${name}`)
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

function loadFile<T>(filePath: string): T {
  if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`)
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true })
}

function avg(nums: number[]): number {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0
}

function formatId(id: string): string {
  return id
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function extractZip(zipPath: string, destinationDir: string) {
  if (process.platform === 'win32') {
    const psPath = zipPath.replace(/'/g, "''")
    const psDest = destinationDir.replace(/'/g, "''")
    execFileSync(
      'powershell',
      [
        '-NoProfile',
        '-Command',
        `Expand-Archive -Path '${psPath}' -DestinationPath '${psDest}' -Force`,
      ],
      { stdio: 'inherit' },
    )
    return
  }

  execFileSync('unzip', ['-o', '-q', zipPath, '-d', destinationDir], { stdio: 'inherit' })
}

async function downloadF1DB() {
  ensureDir(CACHE_DIR)
  const zipPath = path.join(CACHE_DIR, 'f1db-json-splitted.zip')
  if (fs.existsSync(path.join(CACHE_DIR, 'f1db-drivers.json'))) return

  console.log('Downloading F1DB splitted JSON...')
  const url = 'https://github.com/f1db/f1db/releases/download/v2026.2.3/f1db-json-splitted.zip'
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to download F1DB: ${res.status}`)
  fs.writeFileSync(zipPath, Buffer.from(await res.arrayBuffer()))

  extractZip(zipPath, CACHE_DIR)
}

/** Historical factory / wealth tier for development budget (independent of single-season form). */
const BUDGET_PRESTIGE: Record<string, number> = {
  ferrari: 97,
  mercedes: 96,
  mclaren: 91,
  red_bull: 89,
  williams: 84,
  renault: 80,
  'mercedes-benz': 96,
  benetton: 76,
  lotus: 74,
  brawn: 72,
  tyrrell: 68,
  sauber: 65,
  jaguar: 70,
  toyota: 82,
  honda: 78,
  alpine: 76,
  aston_martin: 83,
  hesketh: 30,
  minardi: 28,
  manor: 26,
  hrt: 24,
  caterham: 25,
  ags: 27,
  osella: 28,
  pacific: 26,
  simtek: 25,
  lola: 40,
  arrows: 45,
  footwork: 42,
  prost: 55,
  spyker: 38,
  super_aguri: 35,
  toro_rosso: 58,
  alphatauri: 62,
  rb: 75,
}

function budgetLabel(rating: number): string {
  if (rating >= 92) return 'Massive factory budget'
  if (rating >= 78) return 'Large budget'
  if (rating >= 62) return 'Moderate budget'
  if (rating >= 45) return 'Limited budget'
  return 'Minimal budget'
}

function buildTeamPrincipal(
  constructorId: string,
  constructorName: string,
  year: number,
  wccPosition: number,
  curated: TeamPrincipalEntry[],
): DraftOption {
  const match = curated.find((c) => c.constructorId === constructorId && c.year === year)
  if (match?.principals[0]) {
    const p = match.principals[0]
    return { id: p.id, name: p.name, rating: p.rating, meta: 'Team Principal' }
  }
  const rating = Math.max(40, Math.min(92, 94 - wccPosition * 4))
  return {
    id: `tp-${constructorId}-${year}`,
    name: `${constructorName} Team Principal`,
    rating,
    meta: 'Team Principal',
  }
}

function buildPitCrew(
  constructorId: string,
  constructorName: string,
  year: number,
  cStats: { dnfs: number; finishes: number[] } | undefined,
  baseConstrRating: number,
): DraftOption {
  const starts = cStats ? cStats.finishes.length + cStats.dnfs : 1
  const dnfRate = cStats ? cStats.dnfs / starts : 0.15
  const rating = Math.max(38, Math.min(96, Math.round(baseConstrRating - dnfRate * 35 + 5)))
  return {
    id: `pit-${constructorId}-${year}`,
    name: `${constructorName} Pit Crew`,
    rating,
    meta: 'Pit Crew',
  }
}

function buildDevBudget(
  constructorId: string,
  constructorName: string,
  year: number,
  wccPosition: number,
  yoyPointsDelta: number,
): DraftOption {
  const prestige = BUDGET_PRESTIGE[constructorId]
  const base = prestige ?? Math.max(32, Math.min(82, 88 - wccPosition * 5))
  const rating = Math.max(30, Math.min(99, Math.round(base + yoyPointsDelta * 0.04)))
  return {
    id: `budget-${constructorId}-${year}`,
    name: `${constructorName} Development Budget`,
    rating,
    meta: budgetLabel(rating),
  }
}

interface AdminIndexEntry {
  key: string
  year: number
  constructorId: string
  constructorName: string
  slot: AdminSlot
  optionId: string
  name: string
  rating: number
  computedRating: number
  isOverridden: boolean
  seasonForm: number | null
  teammateDelta: number | null
  teammateNames: string[]
  points: number | null
}

function selectPrimaryRaceDrivers(
  raceDrivers: { driverId: string }[],
  driverSeasonStats: Record<string, { points: number; wins: number }>,
  maxDrivers = 2,
): { driverId: string }[] {
  const unique = [...new Map(raceDrivers.map((d) => [d.driverId, d])).values()]
  return unique
    .sort(
      (a, b) =>
        (driverSeasonStats[b.driverId]?.points ?? 0) -
        (driverSeasonStats[a.driverId]?.points ?? 0),
    )
    .slice(0, maxDrivers)
}

function buildYearDriverEntries(
  entrantData: { constructorId: string; raceDrivers: { driverId: string }[] }[],
  driverSeasonStats: Record<string, { points: number; wins: number; poles: number; finishes: number[]; dnfs: number }>,
) {
  const entries: {
    driverId: string
    constructorId: string
    points: number
    wins: number
    raceStarts: number
  }[] = []

  for (const ed of entrantData) {
    for (const rd of ed.raceDrivers) {
      const stats = driverSeasonStats[rd.driverId]
      if (!stats) continue
      entries.push({
        driverId: rd.driverId,
        constructorId: ed.constructorId,
        points: stats.points,
        wins: stats.wins,
        raceStarts: stats.finishes.length + stats.dnfs,
      })
    }
  }

  return entries
}

function computeTeamDriverRatings(
  constructorId: string,
  raceDrivers: { driverId: string }[],
  driverSeasonStats: Record<string, { points: number; wins: number; poles: number; finishes: number[]; dnfs: number }>,
  driverMap: Record<string, { fullName?: string; name: string }>,
  yearMaxScore: number,
  careerPeakToDate: Map<string, number>,
  driverSeasonsToDate: Map<string, number>,
  allYearPoints: number[],
  ratingContext: YearRatingContext,
) {
  const entries = raceDrivers
    .map((rd) => {
      const stats = driverSeasonStats[rd.driverId]
      if (!stats) return null
      return {
        driverId: rd.driverId,
        constructorId,
        points: stats.points,
        wins: stats.wins,
        raceStarts: stats.finishes.length + stats.dnfs,
      }
    })
    .filter((e): e is NonNullable<typeof e> => e !== null)

  const nameByDriverId = Object.fromEntries(
    entries.map((e) => [
      e.driverId,
      driverMap[e.driverId]?.fullName ?? driverMap[e.driverId]?.name ?? formatId(e.driverId),
    ]),
  )

  return computeDriverRatingsForTeam(
    entries,
    yearMaxScore,
    nameByDriverId,
    careerPeakToDate,
    driverSeasonsToDate,
    allYearPoints,
    ratingContext,
  )
}

function applySlotOverride(
  option: DraftOption,
  year: number,
  constructorId: string,
  slot: AdminSlot,
  overrides: RatingOverridesFile,
): DraftOption {
  const applied = applyOverride(option.rating, year, constructorId, slot, option.id, overrides)
  return {
    ...option,
    rating: applied.rating,
    ratingBreakdown: applied.isOverridden
      ? {
          seasonForm: option.rating,
          teammateDelta: null,
          teammateBaseline: null,
          teammateNames: [],
          deltaPercentile: null,
          computedRating: option.rating,
          raceStarts: 0,
          isOverridden: true,
        }
      : option.ratingBreakdown,
  }
}

function withOverrideFallback(
  option: DraftOption,
  year: number,
  constructorId: string,
  slot: AdminSlot,
  overrides: RatingOverridesFile,
): DraftOption {
  return applySlotOverride(option, year, constructorId, slot, overrides)
}

function pushAdminIndex(
  adminIndex: AdminIndexEntry[],
  pack: {
    year: number
    constructorId: string
    constructorName: string
    draftPool: Record<AdminSlot, DraftOption[]>
  },
  overrides: RatingOverridesFile,
) {
  const slots: AdminSlot[] = [
    'drivers',
    'chassis',
    'engines',
    'teamPrincipals',
    'pitTeams',
    'devBudgets',
    'reserves',
  ]

  for (const slot of slots) {
    for (const option of pack.draftPool[slot] ?? []) {
      const key = overrideKey(pack.year, pack.constructorId, slot, option.id)
      const breakdown = option.ratingBreakdown
      const computedRating = breakdown?.computedRating ?? option.rating
      adminIndex.push({
        key,
        year: pack.year,
        constructorId: pack.constructorId,
        constructorName: pack.constructorName,
        slot,
        optionId: option.id,
        name: option.name,
        rating: option.rating,
        computedRating,
        isOverridden: breakdown?.isOverridden ?? !!overrides.overrides[key],
        seasonForm: breakdown?.seasonForm ?? null,
        teammateDelta: breakdown?.teammateDelta ?? null,
        teammateNames: breakdown?.teammateNames ?? [],
        points: option.stats?.points ?? null,
      })
    }
  }
}

function buildReserveDriver(
  constructorId: string,
  constructorName: string,
  year: number,
  testDrivers: { driverId: string }[],
  driverMap: Record<string, { fullName?: string; name: string }>,
  driverSeasonStats: Record<string, { points: number; wins: number }>,
  allDriverScores: number[],
  baseConstrRating: number,
): DraftOption {
  if (testDrivers.length > 0) {
    const td = testDrivers[0]
    const d = driverMap[td.driverId]
    const stats = driverSeasonStats[td.driverId]
    const score = stats ? stats.points + stats.wins * 5 : 0
    return {
      id: td.driverId,
      name: d?.fullName ?? d?.name ?? formatId(td.driverId),
      rating: stats ? percentileRating(score, allDriverScores) : Math.max(30, baseConstrRating - 28),
      meta: 'Reserve Driver',
    }
  }
  return {
    id: `reserve-${constructorId}-${year}`,
    name: `${constructorName} Reserve Driver`,
    rating: Math.max(30, baseConstrRating - 30),
    meta: 'Reserve Driver',
  }
}

async function main() {
  await downloadF1DB()

  const drivers = loadJson<{ id: string; name: string; fullName: string }[]>('f1db-drivers.json')
  const constructors = loadJson<{ id: string; name: string; fullName: string }[]>('f1db-constructors.json')
  const engines = loadJson<{ id: string; engineManufacturerId: string; name: string; fullName: string }[]>('f1db-engines.json')
  const engineMfrs = loadJson<{ id: string; name: string }[]>('f1db-engine-manufacturers.json')
  const seasons = loadJson<{ year: number }[]>('f1db-seasons.json')
  const races = loadJson<{ id: number; year: number; round: number; grandPrixId: string }[]>('f1db-races.json')
  const raceResults = loadJson<{
    raceId: number
    year: number
    round: number
    positionNumber: number | null
    positionText: string
    driverId: string
    constructorId: string
    engineManufacturerId: string
    points: number
    gridPositionNumber: number | null
    reasonRetired: string | null
  }[]>('f1db-races-race-results.json')
  const grandsPrix = loadJson<{ id: string; name: string; fullName: string }[]>('f1db-grands-prix.json')
  const entrantConstructors = loadJson<{
    year: number
    entrantId: string
    constructorId: string
    engineManufacturerId: string
  }[]>('f1db-seasons-entrants-constructors.json')
  const entrantDrivers = loadJson<{
    year: number
    entrantId: string
    constructorId: string
    engineManufacturerId: string
    driverId: string
    testDriver: boolean
  }[]>('f1db-seasons-entrants-drivers.json')
  const entrantChassis = loadJson<{
    year: number
    entrantId: string
    constructorId: string
    engineManufacturerId: string
    chassisId: string
  }[]>('f1db-seasons-entrants-chassis.json')
  const entrantEngines = loadJson<{
    year: number
    entrantId: string
    constructorId: string
    engineManufacturerId: string
    engineId: string
  }[]>('f1db-seasons-entrants-engines.json')
  const curatedTP = loadFile<TeamPrincipalEntry[]>(CURATED_TP)
  const ratingOverrides = loadRatingOverrides()

  const driverMap = Object.fromEntries(drivers.map((d) => [d.id, d]))
  const constructorMap = Object.fromEntries(constructors.map((c) => [c.id, c]))
  const engineMap = Object.fromEntries(engines.map((e) => [e.id, e]))
  const engineMfrMap = Object.fromEntries(engineMfrs.map((e) => [e.id, e]))
  const gpMap = Object.fromEntries(grandsPrix.map((g) => [g.id, g]))

  ensureDir(OUT_DIR)

  const spinIndex: {
    id: string
    constructorId: string
    constructorName: string
    year: number
    weight: number
  }[] = []

  const constructorPointsByYear: Record<number, Record<string, number>> = {}
  const adminIndex: AdminIndexEntry[] = []
  const careerPeakToDate = new Map<string, number>()
  const driverSeasonsToDate = new Map<string, number>()

  for (const { year } of seasons) {
    if (year < YEAR_MIN || year > YEAR_MAX) continue

    const seasonRaces = races.filter((r) => r.year === year).sort((a, b) => a.round - b.round)
    const calendar = seasonRaces.map((r) => gpMap[r.grandPrixId]?.name ?? formatId(r.grandPrixId))

    const yearResults = raceResults.filter((r) => r.year === year)

    const driverSeasonStats: Record<string, { points: number; wins: number; poles: number; finishes: number[]; dnfs: number }> = {}
    const constructorSeasonStats: Record<string, { points: number; wins: number; finishes: number[]; dnfs: number }> = {}
    const engineSeasonStats: Record<string, { points: number; wins: number }> = {}

    for (const result of yearResults) {
      if (!result.driverId || !result.constructorId) continue
      const pos = result.positionNumber
      const isDnf = pos === null || ['R', 'D', 'E', 'W', 'F', 'N'].includes(result.positionText)

      if (!driverSeasonStats[result.driverId]) {
        driverSeasonStats[result.driverId] = { points: 0, wins: 0, poles: 0, finishes: [], dnfs: 0 }
      }
      const ds = driverSeasonStats[result.driverId]
      ds.points += result.points
      if (pos === 1) ds.wins++
      if (result.gridPositionNumber === 1) ds.poles++
      if (isDnf) ds.dnfs++
      else if (pos) ds.finishes.push(pos)

      if (!constructorSeasonStats[result.constructorId]) {
        constructorSeasonStats[result.constructorId] = { points: 0, wins: 0, finishes: [], dnfs: 0 }
      }
      const cs = constructorSeasonStats[result.constructorId]
      cs.points += result.points
      if (pos === 1) cs.wins++
      if (isDnf) cs.dnfs++
      else if (pos) cs.finishes.push(pos)

      const engMfr = result.engineManufacturerId
      if (engMfr) {
        if (!engineSeasonStats[engMfr]) engineSeasonStats[engMfr] = { points: 0, wins: 0 }
        engineSeasonStats[engMfr].points += result.points
        if (pos === 1) engineSeasonStats[engMfr].wins++
      }
    }

    const allDriverScores = Object.values(driverSeasonStats).map((d) => d.points + d.wins * 5)
    const allConstructorScores = Object.values(constructorSeasonStats).map((c) => c.points + c.wins * 8)
    const allEngineScores = Object.values(engineSeasonStats).map((e) => e.points + e.wins * 5)

    const yearEntrantConstructors = entrantConstructors.filter((e) => e.year === year)
    const seenConstructors = new Set<string>()
    const constructorStrengths: { id: string; name: string; strength: number }[] = []
    const entrantData: {
      constructorId: string
      constructor: { id: string; name: string; fullName: string }
      entrantId: string
      raceDrivers: typeof entrantDrivers
      testDrivers: typeof entrantDrivers
      chassisIds: string[]
      engineIds: string[]
      engineManufacturerId: string
      baseConstrRating: number
      wccPosition: number
    }[] = []

    for (const ec of yearEntrantConstructors) {
      if (seenConstructors.has(ec.constructorId)) continue
      seenConstructors.add(ec.constructorId)

      const constructor = constructorMap[ec.constructorId]
      if (!constructor) continue

      const driversForConstructor = entrantDrivers.filter(
        (d) => d.year === year && d.constructorId === ec.constructorId,
      )
      const raceDrivers = selectPrimaryRaceDrivers(
        driversForConstructor.filter((d) => !d.testDriver),
        driverSeasonStats,
      )
      const testDrivers = driversForConstructor.filter((d) => d.testDriver)

      if (raceDrivers.length < 1) continue

      const cStats = constructorSeasonStats[ec.constructorId]
      const wccPosition = cStats
        ? Object.entries(constructorSeasonStats)
            .sort(([, a], [, b]) => b.points - a.points)
            .findIndex(([id]) => id === ec.constructorId) + 1
        : 10

      const baseConstrRating = cStats
        ? percentileRating(cStats.points + cStats.wins * 8, allConstructorScores)
        : 50

      constructorStrengths.push({ id: ec.constructorId, name: constructor.name, strength: baseConstrRating })

      const chassisIds = [
        ...new Set(
          entrantChassis
            .filter((c) => c.year === year && c.constructorId === ec.constructorId)
            .map((c) => c.chassisId),
        ),
      ]
      const engineIds = [
        ...new Set(
          entrantEngines
            .filter((e) => e.year === year && e.constructorId === ec.constructorId)
            .map((e) => e.engineId),
        ),
      ]

      entrantData.push({
        constructorId: ec.constructorId,
        constructor,
        entrantId: ec.entrantId,
        raceDrivers,
        testDrivers,
        chassisIds,
        engineIds,
        engineManufacturerId: ec.engineManufacturerId,
        baseConstrRating,
        wccPosition,
      })
    }

    const yearDir = path.join(OUT_DIR, 'seasons', String(year))
    ensureDir(yearDir)

    const yearDriverEntries = buildYearDriverEntries(entrantData, driverSeasonStats)
    const yearMaxDriverScore = Math.max(
      1,
      ...yearDriverEntries.map((e) => driverSeasonScore(e.points, e.wins)),
    )

    const allYearPoints = yearDriverEntries.map((e) => e.points)
    const teamPointsByConstructor = Object.fromEntries(
      entrantData.map((ed) => [
        ed.constructorId,
        constructorSeasonStats[ed.constructorId]?.points ?? 0,
      ]),
    )
    const ratingContext = buildYearRatingContext(
      yearDriverEntries,
      teamPointsByConstructor,
      Math.max(...allYearPoints, 0),
    )

    for (const entry of yearDriverEntries) {
      driverSeasonsToDate.set(
        entry.driverId,
        (driverSeasonsToDate.get(entry.driverId) ?? 0) + 1,
      )
      const teammateCtx = ratingContext.teammateContextByDriver.get(entry.driverId)
      const teamStrengthPct =
        ratingContext.teamStrengthByConstructor.get(entry.constructorId) ?? 0.5
      const seasonForm = computeSeasonForm(
        entry.points,
        entry.wins,
        yearMaxDriverScore,
        allYearPoints,
        {
          leaderPoints: ratingContext.leaderPoints,
          teamStrengthPct,
          teammateTalent: teammateCtx?.teammateTalent ?? null,
        },
      )
      const prev = careerPeakToDate.get(entry.driverId) ?? 0
      careerPeakToDate.set(entry.driverId, Math.max(prev, seasonForm))
    }

    const yearRatingsByDriver = new Map<string, DriverRatingBreakdown>()

    for (const ed of entrantData) {
      const teamDriverRatings = computeTeamDriverRatings(
        ed.constructorId,
        ed.raceDrivers,
        driverSeasonStats,
        driverMap,
        yearMaxDriverScore,
        careerPeakToDate,
        driverSeasonsToDate,
        allYearPoints,
        ratingContext,
      )

      for (const [driverId, breakdown] of teamDriverRatings) {
        yearRatingsByDriver.set(driverId, breakdown)
      }
    }

    const yearStandings = yearDriverEntries.map((e) => ({
      driverId: e.driverId,
      points: e.points,
      wins: e.wins,
    }))

    finalizeYearDriverRatings(
      yearStandings,
      yearRatingsByDriver,
      yearMaxDriverScore,
      allYearPoints,
    )

    const pointsLeaderId = [...yearStandings].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      return b.wins - a.wins
    })[0]?.driverId

    for (const ed of entrantData) {
      const driverOptions: DraftOption[] = ed.raceDrivers.map((rd) => {
        const d = driverMap[rd.driverId]
        const stats = driverSeasonStats[rd.driverId]
        const breakdown = yearRatingsByDriver.get(rd.driverId)
        const rawRating = breakdown?.computedRating ?? 50
        const computedRating = breakdown
          ? calibrateDriverOvr(rd.driverId, rawRating, {
              seasonForm: breakdown.seasonForm,
              careerPeakToDate: breakdown.careerPeakToDate,
              isPointsLeader: rd.driverId === pointsLeaderId,
            })
          : Math.max(30, rawRating - 5)
        const applied = applyOverride(
          computedRating,
          year,
          ed.constructorId,
          'drivers',
          rd.driverId,
          ratingOverrides,
        )
        return {
          id: rd.driverId,
          name: d?.fullName ?? d?.name ?? formatId(rd.driverId),
          rating: applied.rating,
          stats: stats
            ? {
                wins: stats.wins,
                poles: stats.poles,
                points: stats.points,
                avgFinish: stats.finishes.length ? Math.round(avg(stats.finishes) * 10) / 10 : 0,
                raceStarts: stats.finishes.length + stats.dnfs,
              }
            : undefined,
          ratingBreakdown: breakdown
            ? { ...breakdown, computedRating, isOverridden: applied.isOverridden }
            : undefined,
        }
      })

      if (driverOptions.length === 1) {
        driverOptions.push({
          id: `guest-${ed.constructorId}-${year}`,
          name: 'Guest Driver (Shared Seat)',
          rating: Math.max(35, driverOptions[0].rating - 15),
          meta: 'Historical shared entry',
        })
      }

      const componentCtx = {
        seasonStrength: ed.baseConstrRating,
        wccPosition: ed.wccPosition,
      }

      const chassisOptions: DraftOption[] = ed.chassisIds.map((chId) => {
        const rawRating = ed.baseConstrRating
        const calibrated = calibrateChassisOvr(chId, rawRating, componentCtx)
        const applied = applyOverride(
          calibrated,
          year,
          ed.constructorId,
          'chassis',
          chId,
          ratingOverrides,
        )
        return {
          id: chId,
          name: formatId(chId),
          rating: applied.rating,
          meta: ed.constructor.name,
          ratingBreakdown: applied.isOverridden
            ? {
                seasonForm: rawRating,
                teammateDelta: null,
                teammateBaseline: null,
                teammateNames: [],
                deltaPercentile: null,
                computedRating: calibrated,
                raceStarts: 0,
                isOverridden: true,
              }
            : {
                seasonForm: rawRating,
                teammateDelta: null,
                teammateBaseline: null,
                teammateNames: [],
                deltaPercentile: null,
                computedRating: calibrated,
                raceStarts: 0,
                isOverridden: false,
              },
        }
      })

      const engineOptions: DraftOption[] = ed.engineIds.map((enId) => {
        const e = engineMap[enId]
        const mfr = e ? engineMfrMap[e.engineManufacturerId] : engineMfrMap[ed.engineManufacturerId]
        const engStats = engineSeasonStats[ed.engineManufacturerId]
        const score = engStats ? engStats.points + engStats.wins * 5 : 0
        const rawRating = engStats
          ? percentileRating(score, allEngineScores)
          : ed.baseConstrRating
        const goatOnWinner = isGoatEngine(enId) && ed.wccPosition === 1
        const effectiveRating = goatOnWinner
          ? Math.max(rawRating, ed.baseConstrRating)
          : rawRating
        const engineCtx = {
          seasonStrength: effectiveRating,
          wccPosition: ed.wccPosition,
        }
        const calibrated = calibrateEngineOvr(enId, effectiveRating, engineCtx)
        const applied = applyOverride(
          calibrated,
          year,
          ed.constructorId,
          'engines',
          enId,
          ratingOverrides,
        )
        return {
          id: enId,
          name: e?.fullName ?? e?.name ?? formatId(enId),
          rating: applied.rating,
          meta: mfr?.name,
          ratingBreakdown: applied.isOverridden
            ? {
                seasonForm: rawRating,
                teammateDelta: null,
                teammateBaseline: null,
                teammateNames: [],
                deltaPercentile: null,
                computedRating: calibrated,
                raceStarts: 0,
                isOverridden: true,
              }
            : {
                seasonForm: rawRating,
                teammateDelta: null,
                teammateBaseline: null,
                teammateNames: [],
                deltaPercentile: null,
                computedRating: calibrated,
                raceStarts: 0,
                isOverridden: false,
              },
        }
      })

      const prevPoints = constructorPointsByYear[year - 1]?.[ed.constructorId] ?? 0
      const currentPoints = constructorSeasonStats[ed.constructorId]?.points ?? 0
      const yoyDelta = year > YEAR_MIN ? currentPoints - prevPoints : 0

      const tpOption = buildTeamPrincipal(
        ed.constructorId,
        ed.constructor.name,
        year,
        ed.wccPosition,
        curatedTP,
      )
      const pitOption = buildPitCrew(
        ed.constructorId,
        ed.constructor.name,
        year,
        constructorSeasonStats[ed.constructorId],
        ed.baseConstrRating,
      )
      const budgetOption = buildDevBudget(
        ed.constructorId,
        ed.constructor.name,
        year,
        ed.wccPosition,
        yoyDelta,
      )
      const reserveOption = buildReserveDriver(
        ed.constructorId,
        ed.constructor.name,
        year,
        ed.testDrivers,
        driverMap,
        driverSeasonStats,
        allDriverScores,
        ed.baseConstrRating,
      )

      const opponents = constructorStrengths
        .filter((o) => o.id !== ed.constructorId)
        .map((o) => ({ id: o.id, name: o.name, strength: o.strength }))

      const singleSlots: { slot: AdminSlot; options: DraftOption[] }[] = [
        { slot: 'teamPrincipals', options: [applySlotOverride(tpOption, year, ed.constructorId, 'teamPrincipals', ratingOverrides)] },
        { slot: 'pitTeams', options: [applySlotOverride(pitOption, year, ed.constructorId, 'pitTeams', ratingOverrides)] },
        { slot: 'devBudgets', options: [applySlotOverride(budgetOption, year, ed.constructorId, 'devBudgets', ratingOverrides)] },
        { slot: 'reserves', options: [applySlotOverride(reserveOption, year, ed.constructorId, 'reserves', ratingOverrides)] },
      ]

      const pack = {
        id: `${ed.constructorId}-${year}`,
        constructorId: ed.constructorId,
        constructorName: ed.constructor.name,
        year,
        raceCount: seasonRaces.length || 1,
        calendar: calendar.length ? calendar : ['Season Finale'],
        draftPool: {
          drivers: driverOptions,
          chassis: chassisOptions.length ? chassisOptions : [withOverrideFallback({
            id: `ch-${ed.constructorId}`,
            name: `${ed.constructor.name} Chassis`,
            rating: ed.baseConstrRating,
          }, year, ed.constructorId, 'chassis', ratingOverrides)],
          engines: engineOptions.length ? engineOptions : [withOverrideFallback({
            id: `en-${ed.constructorId}`,
            name: 'Works Engine',
            rating: ed.baseConstrRating,
          }, year, ed.constructorId, 'engines', ratingOverrides)],
          teamPrincipals: singleSlots[0].options,
          pitTeams: singleSlots[1].options,
          devBudgets: singleSlots[2].options,
          reserves: singleSlots[3].options,
        },
        opponents,
        historicalWccPosition: ed.wccPosition,
      }

      fs.writeFileSync(path.join(yearDir, `${ed.constructorId}.json`), JSON.stringify(pack))

      pushAdminIndex(adminIndex, pack, ratingOverrides)

      spinIndex.push({
        id: pack.id,
        constructorId: ed.constructorId,
        constructorName: ed.constructor.name,
        year,
        weight: Math.max(1, 12 - ed.wccPosition) + (ed.raceDrivers.length >= 2 ? 3 : 0),
      })
    }

    constructorPointsByYear[year] = Object.fromEntries(
      Object.entries(constructorSeasonStats).map(([id, s]) => [id, s.points]),
    )
  }

  buildDraftBadges(adminIndex)
  build2026SimulationData()

  fs.writeFileSync(path.join(OUT_DIR, 'spin-index.json'), JSON.stringify(spinIndex))
  fs.writeFileSync(path.join(OUT_DIR, 'era-rules.json'), JSON.stringify({ minYear: YEAR_MIN, maxYear: 2026 }))
  fs.writeFileSync(path.join(OUT_DIR, 'admin-ratings-index.json'), JSON.stringify(adminIndex))
  fs.writeFileSync(path.join(OUT_DIR, 'ratings-meta.json'), JSON.stringify({
    driver: 'Car-aware teammate talent for backmarkers; WDC leads year rating; only points leader can reach 99',
    chassis: '-5 OVR shift; GOAT chassis only reach 90+ in dominant seasons',
    engine: '-5 OVR shift; top 10 GOAT engines only reach 90+ in dominant seasons',
    teamPrincipal: 'Single principal per team-year (curated or synthetic)',
    pitTeam: 'Single pit crew rated on season consistency',
    devBudget: 'Single budget from constructor prestige (Ferrari huge, Hesketh tiny)',
    reserve: 'Single reserve or test driver for that team-year',
  }))

  console.log(`Built ${spinIndex.length} spin entries across ${YEAR_MIN}-${YEAR_MAX}`)
}

type DraftPoolPack = {
  year: number
  constructorId: string
  draftPool: Record<AdminSlot, { id: string; name: string; rating: number; ratingBreakdown?: unknown }[]>
}

function carRatingFromPool(pool: DraftPoolPack['draftPool']): number {
  const chassis = pool.chassis[0]?.rating ?? 50
  const engine = pool.engines[0]?.rating ?? 50
  return Math.round((chassis + engine) / 2)
}

function patchPackWithYearOverrides(pack: DraftPoolPack, overrides: RatingOverridesFile): DraftPoolPack {
  const { year, constructorId, draftPool } = pack
  const patchSlot = (slot: AdminSlot) =>
    draftPool[slot].map((option) =>
      applySlotOverride(option as Parameters<typeof applySlotOverride>[0], year, constructorId, slot, overrides),
    )

  return {
    ...pack,
    draftPool: {
      drivers: patchSlot('drivers'),
      chassis: patchSlot('chassis'),
      engines: patchSlot('engines'),
      teamPrincipals: patchSlot('teamPrincipals'),
      pitTeams: patchSlot('pitTeams'),
      devBudgets: patchSlot('devBudgets'),
      reserves: patchSlot('reserves'),
    },
  }
}

const MIN_SEASONS_FOR_PRIME = 5

function buildDraftBadges(adminIndex: AdminIndexEntry[]) {
  const driverBest = new Map<string, { rating: number; years: number[] }>()
  const driverSeasonCounts = new Map<string, Set<number>>()
  const chassisPeak = new Map<string, number>()
  const enginePeak = new Map<string, number>()

  for (const entry of adminIndex) {
    if (entry.slot === 'drivers') {
      const seasons = driverSeasonCounts.get(entry.optionId) ?? new Set<number>()
      seasons.add(entry.year)
      driverSeasonCounts.set(entry.optionId, seasons)

      const prev = driverBest.get(entry.optionId)
      if (!prev || entry.rating > prev.rating) {
        driverBest.set(entry.optionId, { rating: entry.rating, years: [entry.year] })
      } else if (entry.rating === prev.rating) {
        prev.years.push(entry.year)
      }
      continue
    }
    if (entry.slot === 'chassis') {
      chassisPeak.set(entry.optionId, Math.max(chassisPeak.get(entry.optionId) ?? 0, entry.rating))
    }
    if (entry.slot === 'engines') {
      enginePeak.set(entry.optionId, Math.max(enginePeak.get(entry.optionId) ?? 0, entry.rating))
    }
  }

  const driverPrimeYears: Record<string, number[]> = {}
  for (const [driverId, { years }] of driverBest) {
    const seasonCount = driverSeasonCounts.get(driverId)?.size ?? 0
    if (seasonCount < MIN_SEASONS_FOR_PRIME) continue
    driverPrimeYears[driverId] = years.sort((a, b) => a - b)
  }

  const topComponentIds = (peaks: Map<string, number>) =>
    [...peaks.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 10)
      .map(([id]) => id)

  const payload = {
    driverPrimeYears,
    legend: {
      chassis: topComponentIds(chassisPeak),
      engines: topComponentIds(enginePeak),
    },
  }

  const json = JSON.stringify(payload)
  fs.writeFileSync(path.join(OUT_DIR, 'draft-badges.json'), json)
  fs.writeFileSync(path.join(ROOT, 'src', 'data', 'draft-badges.json'), json)
}

function build2026SimulationData() {
  const srcYear = 2025
  const dstYear = 2026
  const srcDir = path.join(OUT_DIR, 'seasons', String(srcYear))
  const dstDir = path.join(OUT_DIR, 'seasons', String(dstYear))
  if (!fs.existsSync(srcDir)) return

  ensureDir(dstDir)
  const ratingOverrides = loadRatingOverrides()

  for (const file of fs.readdirSync(srcDir)) {
    if (!file.endsWith('.json') || file === 'grid.json') continue
    const raw = fs.readFileSync(path.join(srcDir, file), 'utf-8')
    const updated = raw
      .replaceAll(String(srcYear), String(dstYear))
      .replaceAll(`-${srcYear}`, `-${dstYear}`)
    const pack = patchPackWithYearOverrides(JSON.parse(updated) as DraftPoolPack, ratingOverrides)
    fs.writeFileSync(path.join(dstDir, file), JSON.stringify(pack))
  }

  const gridConfigPath = path.join(ROOT, 'data', 'curated', 'grid-2026-teams.json')
  const gridConfig = JSON.parse(fs.readFileSync(gridConfigPath, 'utf-8')) as {
    teams: { packId: string; id?: string; name?: string }[]
  }

  const templatePath = path.join(dstDir, 'mclaren.json')
  if (!fs.existsSync(templatePath)) return
  const template = JSON.parse(fs.readFileSync(templatePath, 'utf-8')) as {
    raceCount: number
    calendar: string[]
    constructorName: string
  }

  const teams: {
    id: string
    name: string
    strength: number
    carRating: number
    drivers: { id: string; name: string; rating: number }[]
  }[] = []

  for (const teamConfig of gridConfig.teams) {
    const oppPath = path.join(dstDir, `${teamConfig.packId}.json`)
    if (!fs.existsSync(oppPath)) continue
    const oppPack = JSON.parse(fs.readFileSync(oppPath, 'utf-8')) as DraftPoolPack & {
      constructorName: string
    }
    const gridId = teamConfig.id ?? teamConfig.packId
    const carRating = carRatingFromPool(oppPack.draftPool)
    teams.push({
      id: gridId,
      name: teamConfig.name ?? oppPack.constructorName,
      strength: carRating,
      carRating,
      drivers: oppPack.draftPool.drivers.slice(0, 2).map((d) => ({
        id: `${gridId}__${d.id}`,
        name: d.name,
        rating: d.rating,
      })),
    })
  }

  const grid = {
    year: dstYear,
    raceCount: template.raceCount,
    calendar: template.calendar,
    teams,
  }
  const gridJson = JSON.stringify(grid)
  fs.writeFileSync(path.join(dstDir, 'grid.json'), gridJson)
  fs.writeFileSync(path.join(ROOT, 'src', 'data', 'grid-2026.json'), gridJson)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
