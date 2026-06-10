import type { SeasonResult } from '../types/game'
import type { DraftPick } from '../types/game'
import { computeSeasonAchievements } from '../engine/seasonAchievements'
import { TIER_LABELS } from '../engine/simulateSeason'

const STORAGE_KEY = 'f1-champion-trophy-cabinet-v1'

export interface TrophySlot {
  id: string
  label: string
  emoji: string
  count: number
}

export interface ArchivedRun {
  id: string
  savedAt: string
  runSeed: number
  tier: string
  wccPosition: number
  year: number
  achievements: string[]
}

export interface TrophyCabinetState {
  trophies: TrophySlot[]
  runs: ArchivedRun[]
}

const TIER_TROPHIES: Record<string, { label: string; emoji: string }> = {
  'double-champion': { label: 'Double Champion', emoji: '🏆' },
  'constructors-champion': { label: 'Constructors Champion', emoji: '🥇' },
  'podium-team': { label: 'Podium Team', emoji: '🥈' },
  'points-finisher': { label: 'Points Finisher', emoji: '🥉' },
  backmarker: { label: 'Backmarker', emoji: '🏁' },
}

const ACHIEVEMENT_EMOJI: Record<string, string> = {
  wdc: '👑',
  wc: '💎',
  'podium-every-race': '🏅',
  'no-retirements': '🛡️',
  'win-every-race': '🔥',
  'total-domination': '⚡',
  'wcc-no-respins': '🎯',
  'wdc-no-respins': '🧊',
}

function loadState(): TrophyCabinetState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as TrophyCabinetState
  } catch {
    /* ignore */
  }
  return { trophies: [], runs: [] }
}

function saveState(state: TrophyCabinetState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function upsertTrophy(trophies: TrophySlot[], id: string, label: string, emoji: string): TrophySlot[] {
  const existing = trophies.find((t) => t.id === id)
  if (existing) {
    return trophies.map((t) => (t.id === id ? { ...t, count: t.count + 1 } : t))
  }
  return [...trophies, { id, label, emoji, count: 1 }]
}

export function archiveRun(
  result: SeasonResult,
  _picks: DraftPick[],
  runSeed: number,
): TrophyCabinetState {
  const state = loadState()
  const achievements = computeSeasonAchievements(result)
  const achievedIds = achievements.filter((a) => a.achieved).map((a) => a.id)

  let trophies = [...state.trophies]
  const tierMeta = TIER_TROPHIES[result.tier]
  if (tierMeta) {
    trophies = upsertTrophy(trophies, `tier-${result.tier}`, tierMeta.label, tierMeta.emoji)
  }

  for (const achievement of achievements.filter((a) => a.achieved)) {
    trophies = upsertTrophy(
      trophies,
      achievement.id,
      achievement.shortLabel,
      ACHIEVEMENT_EMOJI[achievement.id] ?? '🏆',
    )
  }

  const run: ArchivedRun = {
    id: `${Date.now()}-${runSeed}`,
    savedAt: new Date().toISOString(),
    runSeed,
    tier: TIER_LABELS[result.tier],
    wccPosition: result.wccPosition,
    year: result.year,
    achievements: achievedIds,
  }

  const next: TrophyCabinetState = {
    trophies: trophies.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
    runs: [run, ...state.runs].slice(0, 50),
  }
  saveState(next)
  return next
}

export function getTrophyCabinet(): TrophyCabinetState {
  return loadState()
}

export function clearTrophyCabinet(): void {
  localStorage.removeItem(STORAGE_KEY)
}
