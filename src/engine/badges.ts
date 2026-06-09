import type { DraftOption, SlotType } from '../types/game'
import { publicUrl } from '../lib/publicUrl'
import bundledBadges from '../data/draft-badges.json'

export type OptionBadge = 'prime' | 'legend'

export interface DraftBadgeData {
  driverPrimeYears: Record<string, number[]>
  legend: {
    chassis: string[]
    engines: string[]
  }
}

let cachedBadges: DraftBadgeData = bundledBadges as DraftBadgeData

export function getDraftBadges(): DraftBadgeData {
  return cachedBadges
}

export async function loadDraftBadges(): Promise<DraftBadgeData> {
  try {
    const res = await fetch(publicUrl('data/draft-badges.json'))
    if (res.ok) {
      cachedBadges = (await res.json()) as DraftBadgeData
    }
  } catch {
    /* bundled fallback */
  }
  return cachedBadges
}

export function resolveDriverBadge(
  option: DraftOption,
  packYear: number,
  badges: DraftBadgeData,
): OptionBadge | null {
  const primeYears = badges.driverPrimeYears[option.id]
  return primeYears?.includes(packYear) ? 'prime' : null
}

export function resolveComponentBadge(
  option: DraftOption,
  slot: SlotType,
  badges: DraftBadgeData,
): OptionBadge | null {
  const { legend } = badges
  if (slot === 'chassis' && legend.chassis.includes(option.id)) return 'legend'
  if (slot === 'engine' && legend.engines.includes(option.id)) return 'legend'
  return null
}

export function resolveOptionBadge(
  option: DraftOption,
  slot: SlotType,
  packYear: number,
  badges: DraftBadgeData,
): OptionBadge | null {
  if (slot === 'driver1' || slot === 'driver2' || slot === 'reserveDriver') {
    return resolveDriverBadge(option, packYear, badges)
  }
  return resolveComponentBadge(option, slot, badges)
}

export function getDriverBadge(option: DraftOption, packYear: number): OptionBadge | null {
  return resolveDriverBadge(option, packYear, getDraftBadges())
}

export function getComponentBadge(option: DraftOption, slot: SlotType): OptionBadge | null {
  return resolveComponentBadge(option, slot, getDraftBadges())
}

export function getOptionBadge(
  option: DraftOption,
  slot: SlotType,
  packYear: number,
): OptionBadge | null {
  return resolveOptionBadge(option, slot, packYear, getDraftBadges())
}
