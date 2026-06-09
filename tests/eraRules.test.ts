import { describe, it, expect } from 'vitest'
import { constructorPointsFromRace, getEraRules, pointsForPosition } from '../src/engine/eraRules'

describe('eraRules', () => {
  it('returns 2010+ points system', () => {
    const rules = getEraRules(2021)
    expect(pointsForPosition(1, rules)).toBe(25)
    expect(pointsForPosition(10, rules)).toBe(1)
    expect(pointsForPosition(11, rules)).toBe(0)
  })

  it('returns 2003-2009 points system', () => {
    const rules = getEraRules(2004)
    expect(pointsForPosition(1, rules)).toBe(10)
    expect(pointsForPosition(8, rules)).toBe(1)
  })

  it('returns pre-1958 no constructor championship flag', () => {
    const rules = getEraRules(1957)
    expect(rules.hasConstructorChampionship).toBe(false)
  })

  it('returns constructor championship from 1958', () => {
    const rules = getEraRules(1958)
    expect(rules.hasConstructorChampionship).toBe(true)
  })

  it('sums constructor points from both drivers', () => {
    const rules = getEraRules(2021)
    expect(constructorPointsFromRace(1, 3, rules)).toBe(25 + 15)
  })

  it('handles DNF correctly', () => {
    const rules = getEraRules(2021)
    expect(constructorPointsFromRace('DNF', 2, rules)).toBe(18)
    expect(constructorPointsFromRace('DNF', 'DNF', rules)).toBe(0)
  })

  it('applies best-race-count for older eras', () => {
    const rules = getEraRules(1988)
    expect(rules.bestRaceCountForWcc).toBe(11)
    const pts = constructorPointsFromRace(1, 5, rules)
    expect(pts).toBeGreaterThan(0)
  })
})
