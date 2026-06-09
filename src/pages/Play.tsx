import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { allSlotsFilled, useGameStore } from '../store/gameStore'
import { SpinReel } from '../components/SpinReel'
import { DraftBoard } from '../components/DraftBoard'
import { OptionPool } from '../components/OptionPool'
import { SeasonTicker } from '../components/SeasonTicker'
import { ResultsPanel } from '../components/ResultsPanel'
import { PrioritySelect } from '../components/PrioritySelect'
import { TeamRatingsPanel } from '../components/TeamRatingsPanel'
import { getAllAvailableOptionGroups } from '../engine/spinPool'
import { DRIVER_PRIORITY_LABELS, SLOT_ORDER } from '../types/game'
import { RESPINS_PER_RUN } from '../config/gameConfig'
import { useDevGate } from '../hooks/useDevGate'

const RACE_TICK_MS = 1100
const RESULTS_PAUSE_MS = 1200

export function Play() {
  const [searchParams] = useSearchParams()
  const mode = (searchParams.get('mode') as 'classic' | 'expert') ?? 'classic'
  const devUnlocked = useDevGate()

  const {
    phase,
    driverPriority,
    spinEntry,
    seasonPack,
    simulationGrid,
    picks,
    result,
    respinsUsed,
    spinIndex,
    setMode,
    setDriverPriority,
    initSpinIndex,
    startSpin,
    respinCurrent,
    selectPick,
    beginSimulation,
    finishSimulation,
    reset,
    simulationError,
  } = useGameStore()

  const maxRespins = devUnlocked ? null : RESPINS_PER_RUN
  const respinsRemaining =
    maxRespins === null ? null : Math.max(0, maxRespins - respinsUsed)

  const [isSpinning, setIsSpinning] = useState(false)
  const [tickerRound, setTickerRound] = useState(0)
  const [tickerPoints, setTickerPoints] = useState(0)
  const simulationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setMode(mode)
    initSpinIndex().catch(console.error)
  }, [mode, setMode, initSpinIndex])

  useEffect(() => {
    setIsSpinning(phase === 'spinning')
  }, [phase])

  const draftComplete = allSlotsFilled(picks)

  useEffect(() => {
    if (phase !== 'draft' || !draftComplete || result) return
    beginSimulation().catch(console.error)
  }, [phase, draftComplete, result, beginSimulation, picks])

  const skipSimulation = useCallback(() => {
    if (!result) return
    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current)
      simulationTimerRef.current = null
    }
    setTickerRound(result.raceResults.length)
    setTickerPoints(result.totalPoints)
    finishSimulation()
  }, [result, finishSimulation])

  useEffect(() => {
    if (phase !== 'simulate' || !result) return
    const results = result.raceResults
    let round = 0
    let points = 0
    const interval = setInterval(() => {
      round++
      if (round > results.length) {
        clearInterval(interval)
        simulationTimerRef.current = null
        setTimeout(() => finishSimulation(), RESULTS_PAUSE_MS)
        return
      }
      points += results[round - 1].teamPoints
      setTickerRound(round)
      setTickerPoints(points)
    }, RACE_TICK_MS)
    simulationTimerRef.current = interval
    return () => {
      clearInterval(interval)
      simulationTimerRef.current = null
    }
  }, [phase, result, finishSimulation])

  const handleSpin = async () => {
    setIsSpinning(true)
    await startSpin()
    setIsSpinning(false)
  }

  const optionGroups = seasonPack ? getAllAvailableOptionGroups(seasonPack.draftPool, picks) : []

  const handleSelect = async (
    slot: Parameters<typeof selectPick>[0],
    option: Parameters<typeof selectPick>[1],
  ) => {
    const isFinalPick = picks.length === SLOT_ORDER.length - 1
    if (!isFinalPick) setIsSpinning(true)
    try {
      await selectPick(slot, option)
    } catch (err) {
      console.error(err)
    } finally {
      setIsSpinning(false)
    }
  }

  const driver1Name = picks.find((p) => p.slot === 'driver1')?.option.name ?? 'Driver 1'
  const driver2Name = picks.find((p) => p.slot === 'driver2')?.option.name ?? 'Driver 2'

  const showDraftLayout =
    phase === 'draft' ||
    (phase === 'spinning' && (seasonPack !== null || picks.length > 0))

  const showFirstSpin =
    phase === 'spin' || (phase === 'spinning' && picks.length === 0 && !seasonPack)

  const showFullWidthResults = phase === 'simulate' || phase === 'results'

  return (
    <div className="min-h-screen py-8">
      <div className={`px-4 ${showFullWidthResults ? '' : 'max-w-5xl mx-auto'}`}>
        <Link to="/" className="text-sm text-white/40 hover:text-white mb-6 inline-block">
          ← Home
        </Link>
      </div>

      <div className={`px-4 ${showFullWidthResults ? '' : 'max-w-5xl mx-auto'}`}>
      {phase === 'priority' && <PrioritySelect onSelect={setDriverPriority} />}

      {showFirstSpin && (
        <div className="flex flex-col items-center">
          <h1 className="text-2xl font-bold mb-2 text-center">Spin your first team</h1>
          <p className="text-white/50 text-sm mb-8 text-center">
            Watch the reels scroll, land on a team and year, then pick any component you like.
          </p>
          {driverPriority && (
            <p className="text-xs text-f1-accent mb-4">
              {DRIVER_PRIORITY_LABELS[driverPriority]}
            </p>
          )}
          <SpinReel
            entry={spinEntry}
            spinPool={spinIndex}
            isSpinning={isSpinning}
            onSpin={handleSpin}
            spinReady={spinIndex.length > 0}
          />
        </div>
      )}

      {showDraftLayout && (
        <div className="lg:grid lg:grid-cols-[1fr_220px] lg:gap-8 lg:items-start">
          <div className="space-y-6">
            {(seasonPack && spinEntry) || isSpinning ? (
              <SpinReel
                entry={spinEntry}
                spinPool={spinIndex}
                isSpinning={isSpinning}
                onSpin={() => {}}
                hideSpinButton
                onRespin={respinCurrent}
                canRespin={
                  (devUnlocked || respinsRemaining === null || respinsRemaining > 0) &&
                  !isSpinning &&
                  !!seasonPack
                }
                respinsRemaining={devUnlocked ? null : respinsRemaining}
              />
            ) : null}
            <DraftBoard
              picks={picks}
              currentConstructorName={seasonPack?.constructorName}
              currentYear={seasonPack?.year}
            />
            {!isSpinning && seasonPack && !draftComplete ? (
              <div>
                <h2 className="text-lg font-bold mb-1">Choose a component</h2>
                <p className="text-sm text-white/50 mb-4">
                  All options from {seasonPack.constructorName} {seasonPack.year} — pick one, then
                  re-spin
                  {maxRespins !== null && ` (${respinsRemaining ?? maxRespins} left this run)`}.
                </p>
                <OptionPool
                  groups={optionGroups}
                  mode={mode}
                  onSelect={handleSelect}
                  disabled={isSpinning}
                />
              </div>
            ) : (
              isSpinning && (
                <p className="text-center text-white/50 text-sm py-4">
                  {picks.length > 0 ? 'Spinning next team...' : 'Loading team...'}
                </p>
              )
            )}
            {draftComplete && phase === 'draft' && (
              <div className="text-center py-4 space-y-3">
                <p className="text-white/50 text-sm">Starting season...</p>
                {simulationError && (
                  <>
                    <p className="text-f1-red text-sm">{simulationError}</p>
                    <button
                      type="button"
                      onClick={() => beginSimulation().catch(console.error)}
                      className="px-6 py-2 rounded-full bg-f1-red font-semibold text-white text-sm"
                    >
                      Retry simulation
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="hidden lg:block mt-6 lg:mt-0">
            <TeamRatingsPanel picks={picks} />
          </div>
        </div>
      )}

      {picks.length > 0 && showDraftLayout && (
        <div className="lg:hidden mt-6">
          <TeamRatingsPanel picks={picks} />
        </div>
      )}

      </div>

      {phase === 'simulate' && result && simulationGrid && (
        <div className="w-full px-3 sm:px-4 lg:px-6">
          {devUnlocked && (
            <div className="flex justify-center mb-4">
              <button
                type="button"
                onClick={skipSimulation}
                className="px-5 py-2 rounded-full border border-white/30 text-white/80 text-sm hover:border-f1-accent"
              >
                Skip to results
              </button>
            </div>
          )}
          <SeasonTicker
            result={result}
            currentRound={tickerRound || 1}
            totalRounds={simulationGrid.raceCount}
            totalPoints={tickerPoints}
            constructorName="Your Dream Team"
            driver1Name={driver1Name}
            driver2Name={driver2Name}
          />
        </div>
      )}

      {phase === 'results' && result && (
        <div className="w-full px-3 sm:px-4 lg:px-6">
          <ResultsPanel
            result={result}
            mode={mode}
            picks={picks}
            onPlayAgain={() => {
              reset()
              setMode(mode)
              setTickerRound(0)
              setTickerPoints(0)
            }}
          />
        </div>
      )}
    </div>
  )
}
