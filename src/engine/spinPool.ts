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

export function pickRandomSpin(
  entries: SpinEntry[],
  rand: () => number = Math.random,
): SpinEntry {
  const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0)
  let r = rand() * totalWeight
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

export type DriverSlot = 'driver1' | 'driver2' | 'reserveDriver'

export interface DriverPoolOption {
  option: DraftOption
  availableSlots: DriverSlot[]
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

/** Placeholder reserve entries with no real driver name. */
export function isSyntheticReserveOption(option: DraftOption): boolean {
  return option.id.startsWith('reserve-')
}

/** Reserve slot draws from the spun team's race lineup first, then named reserves. */
export function reserveDriverOptions(
  pool: DraftPool,
  usedDriverIds: Set<string>,
): DraftOption[] {
  const lineup = pool.drivers.filter((d) => !usedDriverIds.has(d.id))
  if (lineup.length > 0) return lineup

  const namedReserves = pool.reserves.filter(
    (o) => !usedDriverIds.has(o.id) && !isSyntheticReserveOption(o),
  )
  if (namedReserves.length > 0) return namedReserves

  return pool.reserves.filter((o) => !usedDriverIds.has(o.id))
}

export function getAllAvailableOptionGroups(pool: DraftPool, picks: DraftPick[]): OptionGroup[] {
  const groups: OptionGroup[] = []
  const usedDrivers = usedDriverIds(picks)

  const availableDriverSlots: DriverSlot[] = []
  if (!isSlotFilled(picks, 'driver1')) availableDriverSlots.push('driver1')
  if (!isSlotFilled(picks, 'driver2')) availableDriverSlots.push('driver2')
  if (!isSlotFilled(picks, 'reserveDriver')) availableDriverSlots.push('reserveDriver')

  if (availableDriverSlots.length > 0) {
    const lineupDrivers = pool.drivers.filter((d) => !usedDrivers.has(d.id))
    const driverOptions: DriverPoolOption[] = lineupDrivers.map((option) => ({
      option,
      availableSlots: availableDriverSlots,
    }))

    if (
      availableDriverSlots.includes('reserveDriver') &&
      lineupDrivers.length === 0
    ) {
      const lineupIds = new Set(pool.drivers.map((d) => d.id))
      for (const option of reserveDriverOptions(pool, usedDrivers)) {
        if (lineupIds.has(option.id)) continue
        driverOptions.push({ option, availableSlots: ['reserveDriver'] })
      }
    }

    if (driverOptions.length > 0) {
      groups.push({
        category: 'Drivers',
        options: [],
        driverOptions,
      })
    }
  }

  const singleSlots: { slot: SlotType; poolKey: keyof DraftPool; category: string }[] = [
    { slot: 'chassis', poolKey: 'chassis', category: 'Chassis' },
    { slot: 'engine', poolKey: 'engines', category: 'Engines' },
    { slot: 'teamPrincipal', poolKey: 'teamPrincipals', category: 'Team Principals' },
    { slot: 'engineerCrew', poolKey: 'pitTeams', category: 'Engineer Crew' },
    { slot: 'devBudget', poolKey: 'devBudgets', category: 'Development Budget' },
  ]

  for (const { slot, poolKey, category } of singleSlots) {
    if (isSlotFilled(picks, slot)) continue
    const available = pool[poolKey] as DraftOption[]
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
