import type {
  DraftOption,
  DraftPick,
  DraftPool,
  SeasonPack,
  SimulationGrid,
  SlotType,
  SpinEntry,
} from '../types/game'
import { SLOT_LABELS } from '../types/game'
import { publicUrl } from '../lib/publicUrl'
import bundledSimulationGrid from '../data/grid-2026.json'

export const SIMULATION_YEAR = 2026

export const DEFAULT_SIMULATION_GRID = bundledSimulationGrid as SimulationGrid

function isValidSimulationGrid(grid: unknown): grid is SimulationGrid {
  if (!grid || typeof grid !== 'object') return false
  const g = grid as SimulationGrid
  return (
    typeof g.year === 'number' &&
    typeof g.raceCount === 'number' &&
    Array.isArray(g.calendar) &&
    g.calendar.length > 0 &&
    Array.isArray(g.teams) &&
    g.teams.length > 0 &&
    g.teams.every(
      (t) =>
        Array.isArray(t.drivers) &&
        t.drivers.length > 0 &&
        t.drivers.every((d) => typeof d.id === 'string' && d.id.length > 0),
    )
  )
}

export function gridDriverId(teamId: string, driverId: string): string {
  return `${teamId}__${driverId}`
}

export async function loadSpinIndex(): Promise<SpinEntry[]> {
  const res = await fetch(publicUrl('data/spin-index.json'))
  if (!res.ok) throw new Error('Failed to load spin index')
  return res.json()
}

export async function loadSeasonPack(year: number, constructorId: string): Promise<SeasonPack> {
  const res = await fetch(publicUrl(`data/seasons/${year}/${constructorId}.json`))
  if (!res.ok) throw new Error(`Failed to load season pack for ${constructorId} ${year}`)
  return res.json()
}

export async function loadSimulationGrid(): Promise<SimulationGrid> {
  try {
    const res = await fetch(publicUrl(`data/seasons/${SIMULATION_YEAR}/grid.json`))
    if (res.ok) {
      const grid = await res.json()
      if (isValidSimulationGrid(grid)) return grid
      console.warn('Fetched simulation grid was invalid; using bundled fallback')
    }
  } catch (err) {
    console.warn('Failed to fetch simulation grid; using bundled fallback', err)
  }
  return DEFAULT_SIMULATION_GRID
}

export function pickRandomSpin(entries: SpinEntry[]): SpinEntry {
  const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0)
  let r = Math.random() * totalWeight
  for (const entry of entries) {
    r -= entry.weight
    if (r <= 0) return entry
  }
  return entries[entries.length - 1]
}

export interface PoolOption {
  option: DraftOption
  slot: SlotType
  fillsLabel: string
}

export interface DriverPoolOption {
  option: DraftOption
  availableSlots: ('driver1' | 'driver2')[]
}

export interface OptionGroup {
  category: string
  options: PoolOption[]
  driverOptions?: DriverPoolOption[]
}

function isSlotFilled(picks: DraftPick[], slot: SlotType): boolean {
  return picks.some((p) => p.slot === slot)
}

function usedDriverIds(picks: DraftPick[]): Set<string> {
  return new Set(
    picks
      .filter((p) => p.slot === 'driver1' || p.slot === 'driver2' || p.slot === 'reserveDriver')
      .map((p) => p.option.id),
  )
}

export function getAllAvailableOptionGroups(pool: DraftPool, picks: DraftPick[]): OptionGroup[] {
  const groups: OptionGroup[] = []
  const usedDrivers = usedDriverIds(picks)

  const d1Open = !isSlotFilled(picks, 'driver1')
  const d2Open = !isSlotFilled(picks, 'driver2')
  if (d1Open || d2Open) {
    const drivers = pool.drivers.filter((d) => !usedDrivers.has(d.id))
    if (drivers.length > 0) {
      const availableSlots: ('driver1' | 'driver2')[] = []
      if (d1Open) availableSlots.push('driver1')
      if (d2Open) availableSlots.push('driver2')
      groups.push({
        category: 'Drivers',
        options: [],
        driverOptions: drivers.map((option) => ({ option, availableSlots })),
      })
    }
  }

  const singleSlots: { slot: SlotType; poolKey: keyof DraftPool; category: string }[] = [
    { slot: 'chassis', poolKey: 'chassis', category: 'Chassis' },
    { slot: 'engine', poolKey: 'engines', category: 'Engines' },
    { slot: 'teamPrincipal', poolKey: 'teamPrincipals', category: 'Team Principals' },
    { slot: 'engineerCrew', poolKey: 'pitTeams', category: 'Engineer Crew' },
    { slot: 'devBudget', poolKey: 'devBudgets', category: 'Development Budget' },
    { slot: 'reserveDriver', poolKey: 'reserves', category: 'Reserve Drivers' },
  ]

  for (const { slot, poolKey, category } of singleSlots) {
    if (isSlotFilled(picks, slot)) continue
    const items = pool[poolKey] as DraftOption[]
    const available =
      slot === 'reserveDriver'
        ? items.filter((o) => !usedDrivers.has(o.id))
        : items
    if (available.length > 0) {
      groups.push({
        category,
        options: available.map((option) => ({
          option,
          slot,
          fillsLabel: SLOT_LABELS[slot],
        })),
      })
    }
  }

  return groups
}
