import type { EngineerEffects } from './ratings'
import type { SeasonPerk } from '../types/game'

export interface DnfRates {
  mechanical: number
  driverError: number
  crash: number
}

export interface PlayerDnfProfile {
  rates: DnfRates
  blockMechanical: boolean
  blockDriverError: boolean
}

export function computePlayerDnfRates(
  engineerEffects: EngineerEffects,
  carReliability: number,
  varianceMod: number,
): DnfRates {
  const mechanical = Math.min(
    0.11,
    engineerEffects.dnfChance * 0.5 +
      engineerEffects.pitstopRisk * 0.4 +
      Math.max(0, 0.05 - carReliability * 0.04),
  )
  const driverError = Math.min(0.09, 0.025 + varianceMod * 0.028)
  const crash = 0.018
  return { mechanical, driverError, crash }
}

export function buildPlayerDnfProfile(
  rates: DnfRates,
  perk: SeasonPerk | null,
): PlayerDnfProfile {
  return {
    rates,
    blockMechanical: perk === 'flawless-engineering',
    blockDriverError: perk === 'driver-wellbeing',
  }
}

export function devGrowthMultiplier(perk: SeasonPerk | null): number {
  return perk === 'huge-sponsor' ? 2 : 1
}

export function creativeRulesCarMultiplier(round: number, perk: SeasonPerk | null): number {
  return perk === 'creative-rules' && round < 5 ? 1.2 : 1
}
