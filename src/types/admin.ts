export type AdminSlot =
  | 'drivers'
  | 'chassis'
  | 'engines'
  | 'teamPrincipals'
  | 'pitTeams'
  | 'devBudgets'
  | 'reserves'

export const ADMIN_SLOT_LABELS: Record<AdminSlot, string> = {
  drivers: 'Drivers',
  chassis: 'Chassis',
  engines: 'Engines',
  teamPrincipals: 'Team Principals',
  pitTeams: 'Engineer Crew',
  devBudgets: 'Dev Budget',
  reserves: 'Reserve',
}

export interface AdminIndexEntry {
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

export interface RatingOverride {
  rating: number
  note?: string
  updatedAt?: string
}

export interface RatingOverridesFile {
  version: number
  overrides: Record<string, RatingOverride>
}
