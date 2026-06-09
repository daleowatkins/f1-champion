import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const OVERRIDES_PATH = path.join(__dirname, '..', 'data', 'curated', 'rating-overrides.json')

export type AdminSlot =
  | 'drivers'
  | 'chassis'
  | 'engines'
  | 'teamPrincipals'
  | 'pitTeams'
  | 'devBudgets'
  | 'reserves'

export interface RatingOverride {
  rating: number
  note?: string
  updatedAt?: string
}

export interface RatingOverridesFile {
  version: number
  overrides: Record<string, RatingOverride>
}

export function overrideKey(
  year: number,
  constructorId: string,
  slot: AdminSlot,
  optionId: string,
): string {
  return `${year}/${constructorId}/${slot}/${optionId}`
}

export function loadRatingOverrides(): RatingOverridesFile {
  if (!fs.existsSync(OVERRIDES_PATH)) {
    return { version: 1, overrides: {} }
  }
  return JSON.parse(fs.readFileSync(OVERRIDES_PATH, 'utf-8')) as RatingOverridesFile
}

export function saveRatingOverrides(data: RatingOverridesFile): void {
  fs.mkdirSync(path.dirname(OVERRIDES_PATH), { recursive: true })
  fs.writeFileSync(OVERRIDES_PATH, JSON.stringify(data, null, 2) + '\n')
}

export function applyOverride(
  computedRating: number,
  year: number,
  constructorId: string,
  slot: AdminSlot,
  optionId: string,
  overrides: RatingOverridesFile,
): { rating: number; isOverridden: boolean } {
  const key = overrideKey(year, constructorId, slot, optionId)
  const override = overrides.overrides[key]
  if (override) {
    return { rating: override.rating, isOverridden: true }
  }
  return { rating: computedRating, isOverridden: false }
}
