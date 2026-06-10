export type GameMode = 'classic' | 'expert'

export type DriverPriority = 'priority-d1' | 'equal' | 'best-form'

export type SlotType =
  | 'driver1'
  | 'driver2'
  | 'chassis'
  | 'engine'
  | 'teamPrincipal'
  | 'engineerCrew'
  | 'devBudget'
  | 'reserveDriver'

export const SLOT_ORDER: SlotType[] = [
  'driver1',
  'driver2',
  'chassis',
  'engine',
  'teamPrincipal',
  'engineerCrew',
  'devBudget',
  'reserveDriver',
]

export const SLOT_LABELS: Record<SlotType, string> = {
  driver1: 'Driver 1',
  driver2: 'Driver 2',
  chassis: 'Chassis',
  engine: 'Engine',
  teamPrincipal: 'Team Principal',
  engineerCrew: 'Engineer Crew',
  devBudget: 'Development Budget',
  reserveDriver: 'Development Driver',
}

export const DRIVER_PRIORITY_LABELS: Record<DriverPriority, string> = {
  'priority-d1': 'Prioritise Driver 1',
  equal: 'Equal treatment',
  'best-form': 'Prioritise best form',
}

export interface ComponentStats {
  wins?: number
  poles?: number
  points?: number
  avgFinish?: number
  dnfRate?: number
  raceStarts?: number
}

export interface RatingBreakdown {
  seasonForm: number
  yearPerformance?: number
  careerPeakToDate?: number
  seasonsToDate?: number
  pointsTierCap?: number
  teammateDelta: number | null
  teammateBaseline: number | null
  teammateNames: string[]
  deltaPercentile: number | null
  computedRating: number
  raceStarts: number
  isOverridden: boolean
}

export interface DraftOption {
  id: string
  name: string
  rating: number
  stats?: ComponentStats
  meta?: string
  ratingBreakdown?: RatingBreakdown
}

export interface DraftPool {
  drivers: DraftOption[]
  chassis: DraftOption[]
  engines: DraftOption[]
  teamPrincipals: DraftOption[]
  /** JSON field name kept for data compatibility */
  pitTeams: DraftOption[]
  devBudgets: DraftOption[]
  reserves: DraftOption[]
}

export interface SpinEntry {
  id: string
  constructorId: string
  constructorName: string
  year: number
  weight: number
}

export interface OpponentTeam {
  id: string
  name: string
  strength: number
}

export interface SeasonPack {
  id: string
  constructorId: string
  constructorName: string
  year: number
  raceCount: number
  calendar: string[]
  draftPool: DraftPool
  opponents: OpponentTeam[]
  historicalWccPosition: number
}

export interface EraRules {
  year: number
  racePoints: number[]
  sprintPoints?: number[]
  hasConstructorChampionship: boolean
  bestRaceCountForWcc?: number
}

export interface DraftPick {
  slot: SlotType
  option: DraftOption
  sourceConstructorId: string
  sourceConstructorName: string
  sourceYear: number
  historicalWccPosition: number
}

export type SimulationEraPolicy = '2026' | 'historical-first-spin'

export type SimulationEraChoice =
  | { type: '2026' }
  | { type: 'historical'; constructorId: string; constructorName: string; year: number }

export function parseEraPolicy(mode: GameMode, eraParam: string | null): SimulationEraPolicy {
  if (mode === 'classic') return '2026'
  return eraParam === 'historical' ? 'historical-first-spin' : '2026'
}

export interface TeamRatings {
  driverLineup: number
  car: number
  support: number
}

export type RaceFinish = number | 'Ret'

export interface DriverRaceCell {
  position: RaceFinish | null
  pole: boolean
  fastestLap: boolean
}

export interface DriverSeasonStanding {
  id: string
  name: string
  teamName: string
  isPlayer: boolean
  races: DriverRaceCell[]
  totalPoints: number
}

export interface RaceResult {
  round: number
  grandPrix: string
  grandPrixCode: string
  driver1Position: number | 'DNF'
  driver2Position: number | 'DNF'
  driver1Points: number
  driver2Points: number
  teamPoints: number
}

export interface SimulationGrid {
  year: number
  raceCount: number
  calendar: string[]
  teams: {
    id: string
    name: string
    /** @deprecated Use carRating — kept for older grid.json files */
    strength: number
    carRating?: number
    drivers: { id: string; name: string; rating?: number }[]
  }[]
}

export type ResultTier =
  | 'double-champion'
  | 'constructors-champion'
  | 'podium-team'
  | 'points-finisher'
  | 'backmarker'

export type SeasonPerk =
  | 'flawless-engineering'
  | 'huge-sponsor'
  | 'creative-rules'
  | 'driver-wellbeing'

export const SEASON_PERK_LABELS: Record<SeasonPerk, string> = {
  'flawless-engineering': 'Flawless Engineering',
  'huge-sponsor': 'Huge Sponsor',
  'creative-rules': 'Creative Rule Interpretation',
  'driver-wellbeing': 'Driver Wellbeing Coach',
}

export const SEASON_PERK_DESCRIPTIONS: Record<SeasonPerk, string> = {
  'flawless-engineering':
    'No retirements from pit stops or mechanical failure — drivers can still crash.',
  'huge-sponsor': 'In-season development rate is doubled.',
  'creative-rules':
    'A hidden design advantage — +20% car performance for the first 5 races.',
  'driver-wellbeing':
    'Drivers stay consistent — no retirements from driver errors.',
}

export interface SeasonResult {
  tier: ResultTier
  wccPosition: number
  wdcPosition: number
  driver2WdcPosition: number
  totalPoints: number
  wins: number
  podiums: number
  poles: number
  raceResults: RaceResult[]
  standings: DriverSeasonStanding[]
  calendar: string[]
  teamStrength: number
  teamRatings: TeamRatings
  constructorName: string
  year: number
  seasonPerk: SeasonPerk | null
  runSeed: number
  simulationEra: SimulationEraChoice
  respinsUsed: number
}

export type GamePhase =
  | 'mode'
  | 'priority'
  | 'spin'
  | 'draft'
  | 'spinning'
  | 'bandit'
  | 'simulate'
  | 'results'
