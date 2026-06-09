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
  reserveDriver: 'Reserved Driver',
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
    strength: number
    drivers: { id: string; name: string }[]
  }[]
}

export type ResultTier =
  | 'double-champion'
  | 'constructors-champion'
  | 'podium-team'
  | 'points-finisher'
  | 'backmarker'

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
}

export type GamePhase =
  | 'mode'
  | 'priority'
  | 'spin'
  | 'draft'
  | 'spinning'
  | 'simulate'
  | 'results'
