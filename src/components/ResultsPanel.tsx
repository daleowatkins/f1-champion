import { useState } from 'react'
import { motion } from 'framer-motion'
import type { DraftPick, GameMode, SeasonResult, SimulationEraChoice, SimulationEraPolicy } from '../types/game'
import { SEASON_PERK_DESCRIPTIONS, SEASON_PERK_LABELS } from '../types/game'
import { computeSeasonAchievements } from '../engine/seasonAchievements'
import { TIER_DESCRIPTIONS, TIER_LABELS } from '../engine/simulateSeason'
import { buildChallengeShareContent, formatShareUrl } from '../lib/runSeed'
import { BeatHistoryPanel } from './BeatHistoryPanel'
import { DraftRecapPanel } from './DraftRecapPanel'
import { WikipediaSeasonTable } from './WikipediaSeasonTable'
import { cn } from '../lib/cn'

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
  const seedUrl = formatShareUrl(result.runSeed, { mode: shareMode, eraPolicy: shareEraPolicy })
  const challengeShare = buildChallengeShareContent({
    tierLabel: TIER_LABELS[result.tier],
    year: result.year,
    wccPosition: result.wccPosition,
    bestWdcPosition: bestWdcPosition,
    totalPoints: result.totalPoints,
    wins: result.wins,
    runSeed: result.runSeed,
    seedUrl,
  })

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: challengeShare.title,
          text: challengeShare.text,
          url: challengeShare.url,
        })
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(challengeShare.text)
      alert('Challenge copied — paste it to invite someone to beat your seed!')
    }
  }

  const handleCopySeed = async () => {
    await navigator.clipboard.writeText(challengeShare.text)
    setSeedCopied(true)
    setTimeout(() => setSeedCopied(false), 2000)
  }

  const tierClass =
    result.tier === 'double-champion'
      ? 'tier-double'
      : result.tier === 'constructors-champion'
        ? 'tier-constructors'
        : 'tier-default'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="text-center mb-8 max-w-4xl mx-auto">
        <p className="text-sm text-muted uppercase tracking-widest font-semibold">Season Complete</p>
        <h2 className="font-serif text-3xl font-extrabold tracking-tight mt-2 text-foreground">
          {result.constructorName}
        </h2>
        <p className="text-muted text-sm">
          {eraLabel(result.simulationEra)} · {result.year} season simulation
        </p>
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className={cn('mt-4 inline-block', tierClass)}
        >
          {TIER_LABELS[result.tier]}
        </motion.div>
        <p className="mt-2 text-muted text-sm">{TIER_DESCRIPTIONS[result.tier]}</p>
        {result.seasonPerk && (
          <div className="mt-4 mx-auto max-w-md np-panel text-left">
            <p className="text-xs text-accent uppercase tracking-widest font-semibold">Season perk</p>
            <p className="font-semibold text-foreground mt-1">{SEASON_PERK_LABELS[result.seasonPerk]}</p>
            <p className="text-sm text-muted mt-1">{SEASON_PERK_DESCRIPTIONS[result.seasonPerk]}</p>
          </div>
        )}
      </div>

      <div className="mb-6 max-w-4xl mx-auto">
        <p className="text-xs text-muted uppercase tracking-widest text-center mb-3 font-semibold">
          Season achievements
        </p>
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              title={achievement.detail}
              className={
                achievement.achieved ? 'achievement-pill-active' : 'achievement-pill-inactive'
              }
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
          <div key={stat.label} className="np-inset p-3 text-center">
            <p className="text-xs text-muted">{stat.label}</p>
            <p className="text-xl font-bold text-foreground">{stat.value}</p>
            {'hint' in stat && stat.hint && (
              <p className="text-[10px] text-muted mt-0.5 truncate">{stat.hint}</p>
            )}
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-muted mb-6 max-w-4xl mx-auto">
        {d1Name} P{result.wdcPosition} WDC · {d2Name} P{result.driver2WdcPosition} WDC
      </p>

      <BeatHistoryPanel picks={picks} playerWcc={result.wccPosition} />

      <DraftRecapPanel picks={picks} />

      <div className="mb-6 max-w-4xl mx-auto np-panel">
        <p className="text-xs text-accent uppercase tracking-widest mb-1 font-semibold">Share this run</p>
        <h3 className="font-serif text-lg font-bold mb-2 text-foreground">Challenge seed</h3>
        <p className="text-sm text-muted mb-3">
          Same seed = same draft spins, bandit, and season sim. Send the link so friends can try to
          beat your result.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <code className="np-inset px-3 py-2 text-sm font-mono text-accent">
            {result.runSeed}
          </code>
          <button type="button" onClick={handleCopySeed} className="np-btn-ghost text-sm">
            {seedCopied ? 'Copied!' : 'Copy challenge invite'}
          </button>
        </div>
        <p className="text-xs text-muted mt-2 break-all font-mono">{seedUrl}</p>
      </div>

      <div className="mb-6 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 px-1 max-w-7xl mx-auto">
          <h3 className="text-sm text-muted uppercase tracking-widest font-semibold">
            {result.year} World Championship — Driver standings
          </h3>
          <button
            type="button"
            onClick={() => setShowFullGrid((expanded) => !expanded)}
            className="np-btn-ghost text-sm shrink-0"
          >
            {showFullGrid
              ? 'Show my drivers only'
              : `Show full grid (${driverCount} drivers)`}
          </button>
        </div>
        <div className="np-well p-2 sm:p-4 overflow-hidden max-w-7xl mx-auto">
          <WikipediaSeasonTable result={result} showAllDrivers={showFullGrid} />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto px-4">
        <button type="button" onClick={handleShare} className="np-btn-ghost flex-1">
          Share challenge
        </button>
        <button type="button" onClick={onPlayAgain} className="np-btn-primary flex-1">
          Build another
        </button>
      </div>
    </motion.div>
  )
}
