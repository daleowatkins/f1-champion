import { create } from 'zustand'
import type {
  DraftPick,
  DriverPriority,
  GameMode,
  GamePhase,
  SeasonPack,
  SeasonPerk,
  SeasonResult,
  SimulationGrid,
  SlotType,
  SpinEntry,
} from '../types/game'
import { SLOT_ORDER } from '../types/game'
import { simulateSeason } from '../engine/simulateSeason'
import {
  DEFAULT_SIMULATION_GRID,
  loadSeasonPack,
  loadSimulationGrid,
  loadSpinIndex,
  pickRandomSpin,
} from '../engine/spinPool'
import { RESPINS_PER_RUN } from '../config/gameConfig'
import { isDevUnlocked } from '../config/devGate'

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

  setMode: (mode: GameMode) => void
  setDriverPriority: (priority: DriverPriority) => void
  initSpinIndex: () => Promise<void>
  startSpin: () => Promise<void>
  respinCurrent: () => Promise<void>
  selectPick: (slot: SlotType, option: DraftPick['option']) => Promise<void>
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

async function spinForSlot(spinIndex: SpinEntry[]): Promise<{
  spinEntry: SpinEntry
  seasonPack: SeasonPack
}> {
  const entries = spinIndex.length > 0 ? spinIndex : await loadSpinIndex()
  const spinEntry = pickRandomSpin(entries)
  const [, seasonPack] = await Promise.all([
    new Promise<void>((r) => setTimeout(r, SPIN_DURATION_MS)),
    loadSeasonPack(spinEntry.year, spinEntry.constructorId),
  ])
  return { spinEntry, seasonPack }
}

async function resolveSimulationGrid(cached: SimulationGrid | null): Promise<SimulationGrid> {
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

  setMode: (mode) => set({ mode, phase: 'priority', driverPriority: null }),

  setDriverPriority: (priority) => set({ driverPriority: priority, phase: 'spin' }),

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
    const { spinIndex, simulationGrid } = get()
    set({ phase: 'spinning' })
    const { spinEntry, seasonPack } = await spinForSlot(spinIndex)
    const entries = spinIndex.length > 0 ? spinIndex : await loadSpinIndex()
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
    })
  },

  respinCurrent: async () => {
    const { respinsUsed, spinIndex, picks } = get()
    const maxRespins = isDevUnlocked() ? Number.POSITIVE_INFINITY : RESPINS_PER_RUN
    if (respinsUsed >= maxRespins) return
    set({ phase: 'spinning' })
    const { spinEntry, seasonPack } = await spinForSlot(spinIndex)
    set({
      spinEntry,
      seasonPack,
      phase: 'draft',
      picks,
      respinsUsed: respinsUsed + 1,
    })
  },

  finishBandit: async (perk) => {
    set({ seasonPerk: perk })
    await get().beginSimulation()
  },

  beginSimulation: async () => {
    const { picks, driverPriority, simulationGrid: cachedGrid, phase, result, seasonPerk } =
      get()
    if (!allSlotsFilled(picks)) return
    if (phase === 'simulate' && result) return
    if (simulationPromise) return simulationPromise

    simulationPromise = (async () => {
      set({ simulationError: null })

      try {
        const simulationGrid = await resolveSimulationGrid(cachedGrid)
        const seasonResult = simulateSeason(
          simulationGrid,
          picks,
          undefined,
          driverPriority ?? 'equal',
          seasonPerk,
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
          phase: get().seasonPerk !== null || get().phase === 'bandit' ? 'bandit' : 'draft',
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
    const { picks, seasonPack, spinIndex } = get()
    if (!seasonPack) return
    if (picks.some((p) => p.slot === slot)) return

    const newPick: DraftPick = {
      slot,
      option,
      sourceConstructorId: seasonPack.constructorId,
      sourceConstructorName: seasonPack.constructorName,
      sourceYear: seasonPack.year,
    }
    const newPicks = [...picks, newPick]

    set({ picks: newPicks, simulationError: null })

    if (allSlotsFilled(newPicks)) {
      set({ picks: newPicks, phase: 'bandit', seasonPerk: null })
      return
    }

    set({ phase: 'spinning' })
    try {
      const spun = await spinForSlot(spinIndex)
      set({
        spinEntry: spun.spinEntry,
        seasonPack: spun.seasonPack,
        phase: 'draft',
      })
    } catch (err) {
      console.error('Failed to load next spin', err)
      set({ phase: 'draft' })
      throw err
    }
  },

  finishSimulation: () => set({ phase: 'results' }),

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
    }),

  goToPhase: (phase) => set({ phase }),
}))
