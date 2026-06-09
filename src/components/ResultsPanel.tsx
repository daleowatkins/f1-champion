import { useState } from 'react'
import { motion } from 'framer-motion'
import type { DraftPick, GameMode, SeasonResult, SimulationEraChoice, SimulationEraPolicy } from '../types/game'
import { SEASON_PERK_DESCRIPTIONS, SEASON_PERK_LABELS } from '../types/game'
import { computeSeasonAchievements } from '../engine/seasonAchievements'
import { TIER_DESCRIPTIONS, TIER_LABELS } from '../engine/simulateSeason'
import { formatShareUrl } from '../lib/runSeed'
import { BeatHistoryPanel } from './BeatHistoryPanel'
import { DraftRecapPanel } from './DraftRecapPanel'
import { WikipediaSeasonTable } from './WikipediaSeasonTable'

function eraLabel(era: SimulationEraChoice): string {
  if (era.type === '2026') return '2026 Championship'
  return `${era.constructorName} ${era.year}`
}

interface Props {
  result: SeasonResult
  picks: DraftPick[]
  shareMode?: GameMode
  shareEraPolicy?: SimulationEraPolicy
  onPlayAgain: () => void
}

export function ResultsPanel({ result, picks, shareMode = 'classic', shareEraPolicy = '2026', onPlayAgain }: Props) {
  const [showFullGrid, setShowFullGrid] = useState(false)
  const [seedCopied, setSeedCopied] = useState(false)
  const achievements = computeSeasonAchievements(result)
  const driverCount = result.standings.length
  const d1Name = picks.find((p) => p.slot === 'driver1')?.option.name ?? 'Driver 1'
  const d2Name = picks.find((p) => p.slot === 'driver2')?.option.name ?? 'Driver 2'
  const bestWdcPosition = Math.min(result.wdcPosition, result.driver2WdcPosition)
  const wdcLeaderName =
    result.wdcPosition <= result.driver2WdcPosition ? d1Name : d2Name
  const shareText = `${result.constructorName} ${result.year}: ${TIER_LABELS[result.tier]} — P${result.wccPosition} WCC, ${result.totalPoints} pts, ${result.wins} wins`
  const seedUrl = formatShareUrl(result.runSeed, { mode: shareMode, eraPolicy: shareEraPolicy })

  const handleShare = async () => {
    const fullText = `${shareText}\n\nReplay seed: ${result.runSeed}\n${seedUrl}`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'F1 Champion Builder', text: fullText, url: seedUrl })
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(fullText)
      alert('Result and seed link copied to clipboard!')
    }
  }

  const handleCopySeed = async () => {
    await navigator.clipboard.writeText(seedUrl)
    setSeedCopied(true)
    setTimeout(() => setSeedCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="text-center mb-8 max-w-4xl mx-auto">
        <p className="text-sm text-white/50 uppercase tracking-widest">Season Complete</p>
        <h2 className="text-3xl font-bold mt-2">{result.constructorName}</h2>
        <p className="text-white/50 text-sm">
          {eraLabel(result.simulationEra)} · {result.year} season simulation
        </p>
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className={`mt-4 inline-block px-6 py-2 rounded-full font-bold text-lg ${
            result.tier === 'double-champion'
              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
              : result.tier === 'constructors-champion'
                ? 'bg-f1-accent/20 text-f1-accent border border-f1-accent/40'
                : 'bg-white/10 text-white border border-white/20'
          }`}
        >
          {TIER_LABELS[result.tier]}
        </motion.div>
        <p className="mt-2 text-white/60 text-sm">{TIER_DESCRIPTIONS[result.tier]}</p>
        {result.seasonPerk && (
          <div className="mt-4 mx-auto max-w-md rounded-xl border border-f1-accent/30 bg-f1-accent/10 px-4 py-3 text-left">
            <p className="text-xs text-f1-accent uppercase tracking-widest">Season perk</p>
            <p className="font-semibold text-white mt-1">{SEASON_PERK_LABELS[result.seasonPerk]}</p>
            <p className="text-sm text-white/55 mt-1">{SEASON_PERK_DESCRIPTIONS[result.seasonPerk]}</p>
          </div>
        )}
      </div>

      <div className="mb-6 max-w-4xl mx-auto">
        <p className="text-xs text-white/40 uppercase tracking-widest text-center mb-3">
          Season achievements
        </p>
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              title={achievement.detail}
              className={`rounded-full px-4 py-2 text-sm font-semibold border transition-colors ${
                achievement.achieved
                  ? 'bg-f1-accent/15 text-f1-accent border-f1-accent/50 shadow-[0_0_12px_rgba(0,210,190,0.25)]'
                  : 'bg-white/5 text-white/30 border-white/10'
              }`}
            >
              {achievement.shortLabel}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2 max-w-4xl mx-auto">
        {[
          { label: 'WCC', value: `P${result.wccPosition}` },
          {
            label: 'WDC',
            value: `P${bestWdcPosition}`,
            hint: wdcLeaderName,
          },
          { label: 'Points', value: result.totalPoints },
          { label: 'Wins', value: result.wins },
          { label: 'Podiums', value: result.podiums },
          { label: 'Team OVR', value: result.teamStrength },
          { label: 'Driver Lineup', value: result.teamRatings.driverLineup },
          { label: 'Car', value: result.teamRatings.car },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg bg-f1-card border border-white/10 p-3 text-center">
            <p className="text-xs text-white/40">{stat.label}</p>
            <p className="text-xl font-bold">{stat.value}</p>
            {'hint' in stat && stat.hint && (
              <p className="text-[10px] text-white/40 mt-0.5 truncate">{stat.hint}</p>
            )}
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-white/40 mb-6 max-w-4xl mx-auto">
        {d1Name} P{result.wdcPosition} WDC · {d2Name} P{result.driver2WdcPosition} WDC
      </p>

      <BeatHistoryPanel picks={picks} playerWcc={result.wccPosition} />

      <DraftRecapPanel picks={picks} />

      <div className="mb-6 max-w-4xl mx-auto rounded-xl border border-f1-accent/25 bg-f1-accent/5 p-5">
        <p className="text-xs text-f1-accent uppercase tracking-widest mb-1">Share this run</p>
        <h3 className="text-lg font-bold mb-2">Challenge seed</h3>
        <p className="text-sm text-white/60 mb-3">
          Same seed = same draft spins, bandit, and season sim. Send the link so friends can try to
          beat your result.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <code className="rounded-lg bg-black/30 px-3 py-2 text-sm font-mono text-f1-accent">
            {result.runSeed}
          </code>
          <button
            type="button"
            onClick={handleCopySeed}
            className="rounded-full border border-white/25 px-4 py-2 text-sm hover:border-f1-accent"
          >
            {seedCopied ? 'Copied!' : 'Copy challenge link'}
          </button>
        </div>
        <p className="text-xs text-white/35 mt-2 break-all font-mono">{seedUrl}</p>
      </div>

      <div className="mb-6 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 px-1">
          <h3 className="text-sm text-white/50 uppercase tracking-widest">
            {result.year} World Championship — Driver standings
          </h3>
          <button
            type="button"
            onClick={() => setShowFullGrid((expanded) => !expanded)}
            className="shrink-0 rounded-full border border-white/25 px-4 py-2 text-sm text-white/80 hover:border-f1-accent hover:text-f1-accent transition-colors"
          >
            {showFullGrid
              ? 'Show my drivers only'
              : `Show full grid (${driverCount} drivers)`}
          </button>
        </div>
        <WikipediaSeasonTable result={result} showAllDrivers={showFullGrid} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
        <button
          type="button"
          onClick={handleShare}
          className="flex-1 py-3 rounded-full border border-white/30 text-white hover:border-f1-accent"
        >
          Share result
        </button>
        <button
          type="button"
          onClick={onPlayAgain}
          className="flex-1 py-3 rounded-full bg-f1-red font-bold text-white"
        >
          Build another
        </button>
      </div>
    </motion.div>
  )
}
