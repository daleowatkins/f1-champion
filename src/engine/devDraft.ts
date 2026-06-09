import type { DraftOption, DraftPick, DraftPool, SeasonPack, SlotType } from '../types/game'
import { SLOT_ORDER } from '../types/game'
import { reserveDriverOptions } from './spinPool'

export interface SlotSource {
  year: number
  constructorId: string
}

type PoolKey = keyof DraftPool

const SLOT_POOL_KEY: Record<SlotType, PoolKey> = {
  driver1: 'drivers',
  driver2: 'drivers',
  chassis: 'chassis',
  engine: 'engines',
  teamPrincipal: 'teamPrincipals',
  engineerCrew: 'pitTeams',
  devBudget: 'devBudgets',
  reserveDriver: 'reserves',
}

export function packCacheKey(source: SlotSource): string {
  return `${source.year}/${source.constructorId}`
}

export function optionsForSlot(
  pack: SeasonPack,
  slot: SlotType,
  usedDriverIds: Set<string> = new Set(),
): DraftOption[] {
  if (slot === 'reserveDriver') {
    return reserveDriverOptions(pack.draftPool, usedDriverIds)
  }
  return pack.draftPool[SLOT_POOL_KEY[slot]] as DraftOption[]
}

export function buildDraftPick(
  slot: SlotType,
  option: DraftOption,
  pack: SeasonPack,
): DraftPick {
  return {
    slot,
    option,
    sourceConstructorId: pack.constructorId,
    sourceConstructorName: pack.constructorName,
    sourceYear: pack.year,
    historicalWccPosition: pack.historicalWccPosition,
  }
}

export function autoFillBest(
  sources: Record<SlotType, SlotSource>,
  packs: Record<string, SeasonPack>,
): Record<SlotType, string> {
  const selection: Partial<Record<SlotType, string>> = {}
  const usedDriverIds = new Set<string>()

  for (const slot of SLOT_ORDER) {
    const pack = packs[packCacheKey(sources[slot])]
    if (!pack) continue

    const isDriverSlot =
      slot === 'driver1' || slot === 'driver2' || slot === 'reserveDriver'
    const options = [...optionsForSlot(pack, slot, usedDriverIds)].sort(
      (a, b) => b.rating - a.rating,
    )

    const pick = options.find((o) => !isDriverSlot || !usedDriverIds.has(o.id))
    if (!pick) continue

    selection[slot] = pick.id
    if (isDriverSlot) usedDriverIds.add(pick.id)
  }

  return selection as Record<SlotType, string>
}

export function selectionToPicks(
  selection: Partial<Record<SlotType, string>>,
  sources: Record<SlotType, SlotSource>,
  packs: Record<string, SeasonPack>,
): DraftPick[] | null {
  const picks: DraftPick[] = []

  for (const slot of SLOT_ORDER) {
    const optionId = selection[slot]
    if (!optionId) return null

    const pack = packs[packCacheKey(sources[slot])]
    if (!pack) return null

    const usedDriverIds = new Set(
      picks
        .filter((p) => p.slot === 'driver1' || p.slot === 'driver2')
        .map((p) => p.option.id),
    )
    const option = optionsForSlot(pack, slot, usedDriverIds).find((o) => o.id === optionId)
    if (!option) return null

    picks.push(buildDraftPick(slot, option, pack))
  }

  const driverIds = picks
    .filter((p) => p.slot === 'driver1' || p.slot === 'driver2' || p.slot === 'reserveDriver')
    .map((p) => p.option.id)
  if (new Set(driverIds).size !== driverIds.length) return null

  return picks
}
