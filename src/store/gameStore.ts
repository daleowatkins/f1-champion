import { create } from 'zustand'
import type {
  DraftPick,
  DriverPriority,
  GameMode,
  GamePhase,
  SeasonPack,
  SeasonPerk,
  SeasonResult,
  SimulationEraChoice,
  SimulationEraPolicy,
  SimulationGrid,
  SlotType,
  SpinEntry,
} from '../types/game'
import { SLOT_ORDER } from '../types/game'
import { simulateSeason } from '../engine/simulateSeason'
import { buildHistoricalSimulationGrid } from '../engine/historicalGrid'
import {
  DEFAULT_SIMULATION_GRID,
  loadSeasonPack,
  loadSimulationGrid,
  loadSpinIndex,
  pickRandomSpin,
  spinEntryKey,
} from '../engine/spinPool'
import { RESPINS_PER_RUN } from '../config/gameConfig'
import { isDevUnlocked } from '../config/devGate'
import { archiveRun } from '../lib/trophyCabinet'
import { trackEvent } from '../lib/analytics'
import { createRunSeed, deriveSeed, pickSpinWithRand, seededRandom } from '../lib/runSeed'

interface GameState {
  phase: GamePhase
  mode: GameMode
  driverPriority: DriverPriority | null
  spinEntry: SpinEntry | null
  seasonPack: SeasonPack | null
  simulationGrid: SimulationGrid | null
  picks: DraftPick[]
  result: SeasonResult | null
  respinsUsed: number
  spinIndex: SpinEntry[]
  simulationError: string | null
  seasonPerk: SeasonPerk | null
  runSeed: number | null
  simulationEra: SimulationEraChoice
  simulationEraPolicy: SimulationEraPolicy
  respinsAtCurrentSlot: number
  rolledSpinKeys: string[]
  slotRolledConstructorIds: string[]

  setMode: (mode: GameMode, eraPolicy?: SimulationEraPolicy) => void
  setRunSeed: (seed: number | null) => void
  setDriverPriority: (priority: DriverPriority) => void
  initSpinIndex: () => Promise<void>
  startSpin: () => Promise<void>
  respinCurrent: () => Promise<void>
  selectPick: (slot: SlotType, option: DraftPick['option']) => Promise<void>
  setSimulationEra: (era: SimulationEraChoice) => void
  finishBandit: (perk: SeasonPerk | null) => Promise<void>
  beginSimulation: () => Promise<void>
  runSimulation: () => void
  finishSimulation: () => void
  reset: () => void
  goToPhase: (phase: GamePhase) => void
}

export function allSlotsFilled(picks: DraftPick[]): boolean {
  return SLOT_ORDER.every((slot) => picks.some((p) => p.slot === slot))
}

const SPIN_DURATION_MS = 2800
let simulationPromise: Promise<void> | null = null

function spinSeedFor(
  runSeed: number | null,
  pickCount: number,
  respinsAtSlot: number,
): number | null {
  if (runSeed === null) return null
  return deriveSeed(runSeed, `spin-${pickCount}-r${respinsAtSlot}`)
}

function rolledKeysSet(keys: string[]): Set<string> {
  return new Set(keys)
}

function recordRoll(
  rolledSpinKeys: string[],
  slotRolledConstructorIds: string[],
  entry: SpinEntry,
): { rolledSpinKeys: string[]; slotRolledConstructorIds: string[] } {
  const key = spinEntryKey(entry)
  return {
    rolledSpinKeys: rolledSpinKeys.includes(key) ? rolledSpinKeys : [...rolledSpinKeys, key],
    slotRolledConstructorIds: slotRolledConstructorIds.includes(entry.constructorId)
      ? slotRolledConstructorIds
      : [...slotRolledConstructorIds, entry.constructorId],
  }
}

async function spinForSlot(
  spinIndex: SpinEntry[],
  runSeed: number | null,
  pickCount: number,
  respinsAtSlot: number,
  excludedKeys: string[],
  excludedConstructorIds: string[],
  randomRespin = false,
): Promise<{
  spinEntry: SpinEntry
  seasonPack: SeasonPack
}> {
  const entries = spinIndex.length > 0 ? spinIndex : await loadSpinIndex()
  const pickOptions = {
    excludedKeys: rolledKeysSet(excludedKeys),
    excludedConstructorIds: rolledKeysSet(excludedConstructorIds),
  }
  const subSeed =
    !randomRespin && runSeed !== null ? spinSeedFor(runSeed, pickCount, respinsAtSlot) : null
  const spinEntry =
    subSeed !== null
      ? pickSpinWithRand(entries, seededRandom(subSeed), pickOptions)
      : pickRandomSpin(entries, Math.random, pickOptions)
  const [, seasonPack] = await Promise.all([
    new Promise<void>((r) => setTimeout(r, SPIN_DURATION_MS)),
    loadSeasonPack(spinEntry.year, spinEntry.constructorId),
  ])
  return { spinEntry, seasonPack }
}

function eraFromSpin(entry: SpinEntry): SimulationEraChoice {
  return {
    type: 'historical',
    constructorId: entry.constructorId,
    constructorName: entry.constructorName,
    year: entry.year,
  }
}

async function resolveSimulationGrid(
  cached: SimulationGrid | null,
  era: SimulationEraChoice,
): Promise<SimulationGrid> {
  if (era.type === 'historical') {
    const pack = await loadSeasonPack(era.year, era.constructorId)
    return buildHistoricalSimulationGrid(pack)
  }
  if (cached?.teams?.length) return cached
  try {
    return await loadSimulationGrid()
  } catch {
    return DEFAULT_SIMULATION_GRID
  }
}

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'mode',
  mode: 'classic',
  driverPriority: null,
  spinEntry: null,
  seasonPack: null,
  simulationGrid: DEFAULT_SIMULATION_GRID,
  picks: [],
  result: null,
  respinsUsed: 0,
  spinIndex: [],
  simulationError: null,
  seasonPerk: null,
  runSeed: null,
  simulationEra: { type: '2026' },
  simulationEraPolicy: '2026',
  respinsAtCurrentSlot: 0,
  rolledSpinKeys: [],
  slotRolledConstructorIds: [],

  setMode: (mode, eraPolicy = '2026') => {
    const policy = mode === 'classic' ? '2026' : eraPolicy
    set({
      mode,
      phase: 'priority',
      driverPriority: null,
      simulationEraPolicy: policy,
      simulationEra: { type: '2026' },
    })
  },

  setRunSeed: (seed) => set({ runSeed: seed }),

  setDriverPriority: (priority) => {
    const { runSeed, mode, simulationEraPolicy } = get()
    trackEvent('game_start', {
      mode,
      era: simulationEraPolicy,
      priority,
    })
    set({
      driverPriority: priority,
      phase: 'spin',
      runSeed: runSeed ?? createRunSeed(),
    })
  },

  initSpinIndex: async () => {
    const [spinIndex, simulationGrid] = await Promise.all([
      loadSpinIndex(),
      loadSimulationGrid().catch((err) => {
        console.error('Failed to preload simulation grid', err)
        return null
      }),
    ])
    set({ spinIndex, simulationGrid: simulationGrid ?? DEFAULT_SIMULATION_GRID })
  },

  startSpin: async () => {
    const { spinIndex, simulationGrid, runSeed, simulationEraPolicy } = get()
    set({ phase: 'spinning', respinsAtCurrentSlot: 0 })
    const { spinEntry, seasonPack } = await spinForSlot(
      spinIndex,
      runSeed,
      0,
      0,
      [],
      [],
      false,
    )
    const entries = spinIndex.length > 0 ? spinIndex : await loadSpinIndex()
    const simulationEra: SimulationEraChoice =
      simulationEraPolicy === 'historical-first-spin'
        ? eraFromSpin(spinEntry)
        : { type: '2026' }
    const rollRecord = recordRoll([], [], spinEntry)
    set({
      spinEntry,
      seasonPack,
      phase: 'draft',
      picks: [],
      result: null,
      simulationError: null,
      spinIndex: entries,
      simulationGrid: simulationGrid ?? get().simulationGrid,
      respinsUsed: 0,
      seasonPerk: null,
      simulationEra,
      respinsAtCurrentSlot: 0,
      rolledSpinKeys: rollRecord.rolledSpinKeys,
      slotRolledConstructorIds: rollRecord.slotRolledConstructorIds,
    })
  },

  respinCurrent: async () => {
    const {
      respinsUsed,
      spinIndex,
      picks,
      runSeed,
      respinsAtCurrentSlot,
      rolledSpinKeys,
      slotRolledConstructorIds,
    } = get()
    const maxRespins = isDevUnlocked() ? Number.POSITIVE_INFINITY : RESPINS_PER_RUN
    if (respinsUsed >= maxRespins) return
    const nextRespin = respinsAtCurrentSlot + 1
    set({ phase: 'spinning' })
    const { spinEntry, seasonPack } = await spinForSlot(
      spinIndex,
      runSeed,
      picks.length,
      nextRespin,
      rolledSpinKeys,
      slotRolledConstructorIds,
      true,
    )
    const rollRecord = recordRoll(rolledSpinKeys, slotRolledConstructorIds, spinEntry)
    set({
      spinEntry,
      seasonPack,
      phase: 'draft',
      picks,
      respinsUsed: respinsUsed + 1,
      respinsAtCurrentSlot: nextRespin,
      rolledSpinKeys: rollRecord.rolledSpinKeys,
      slotRolledConstructorIds: rollRecord.slotRolledConstructorIds,
    })
  },

  setSimulationEra: (era) => set({ simulationEra: era }),

  finishBandit: async (perk) => {
    set({ seasonPerk: perk })
    await get().beginSimulation()
  },

  beginSimulation: async () => {
    const {
      picks,
      driverPriority,
      simulationGrid: cachedGrid,
      phase,
      result,
      seasonPerk,
      runSeed,
      simulationEra,
      respinsUsed,
    } = get()
    if (!allSlotsFilled(picks)) return
    if (phase === 'simulate' && result) return
    if (simulationPromise) return simulationPromise

    simulationPromise = (async () => {
      set({ simulationError: null })

      try {
        const simulationGrid = await resolveSimulationGrid(cachedGrid, simulationEra)
        const simSeed =
          runSeed !== null ? deriveSeed(runSeed, 'sim') : Math.floor(Math.random() * 1_000_000)
        const seasonResult = simulateSeason(
          simulationGrid,
          picks,
          simSeed,
          driverPriority ?? 'equal',
          seasonPerk,
          { runSeed: runSeed ?? simSeed, simulationEra, respinsUsed },
        )
        set({
          result: seasonResult,
          simulationGrid,
          phase: 'simulate',
          seasonPack: null,
          spinEntry: null,
          simulationError: null,
        })
      } catch (err) {
        console.error('Failed to start simulation', err)
        set({
          phase: 'bandit',
          simulationError: 'Could not start the season. Please try again.',
        })
        throw err
      } finally {
        simulationPromise = null
      }
    })()

    return simulationPromise
  },

  selectPick: async (slot, option) => {
    const { picks, seasonPack, spinIndex, runSeed } = get()
    if (!seasonPack) return
    if (picks.some((p) => p.slot === slot)) return

    const newPick: DraftPick = {
      slot,
      option,
      sourceConstructorId: seasonPack.constructorId,
      sourceConstructorName: seasonPack.constructorName,
      sourceYear: seasonPack.year,
      historicalWccPosition: seasonPack.historicalWccPosition,
    }
    const newPicks = [...picks, newPick]

    set({ picks: newPicks, simulationError: null })

    if (allSlotsFilled(newPicks)) {
      set({ picks: newPicks, phase: 'bandit', seasonPerk: null })
      return
    }

    set({ phase: 'spinning', respinsAtCurrentSlot: 0, slotRolledConstructorIds: [] })
    try {
      const { rolledSpinKeys } = get()
      const spun = await spinForSlot(
        spinIndex,
        runSeed,
        newPicks.length,
        0,
        rolledSpinKeys,
        [],
        false,
      )
      const rollRecord = recordRoll(rolledSpinKeys, [], spun.spinEntry)
      set({
        spinEntry: spun.spinEntry,
        seasonPack: spun.seasonPack,
        phase: 'draft',
        rolledSpinKeys: rollRecord.rolledSpinKeys,
        slotRolledConstructorIds: rollRecord.slotRolledConstructorIds,
      })
    } catch (err) {
      console.error('Failed to load next spin', err)
      set({ phase: 'draft' })
      throw err
    }
  },

  finishSimulation: () => {
    const { result, picks, runSeed, mode, respinsUsed, simulationEra } = get()
    if (result) {
      trackEvent('game_complete', {
        mode,
        tier: result.tier,
        era: simulationEra.type === '2026' ? '2026' : 'historical',
        wcc_position: result.wccPosition,
        respins_used: respinsUsed,
      })
      if (runSeed !== null) {
        archiveRun(result, picks, runSeed)
      }
    }
    set({ phase: 'results' })
  },

  runSimulation: async () => {
    await get().beginSimulation()
  },

  reset: () =>
    set({
      phase: 'mode',
      driverPriority: null,
      spinEntry: null,
      seasonPack: null,
      simulationGrid: DEFAULT_SIMULATION_GRID,
      picks: [],
      result: null,
      respinsUsed: 0,
      simulationError: null,
      seasonPerk: null,
      runSeed: null,
      simulationEra: { type: '2026' },
      simulationEraPolicy: '2026',
      respinsAtCurrentSlot: 0,
      rolledSpinKeys: [],
      slotRolledConstructorIds: [],
    }),

  goToPhase: (phase) => set({ phase }),
}))
