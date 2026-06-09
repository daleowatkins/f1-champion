import { describe, it, expect } from 'vitest'
import { RESPINS_PER_RUN } from '../src/config/gameConfig'

describe('gameConfig', () => {
  it('defaults to 3 respins per run', () => {
    expect(RESPINS_PER_RUN).toBe(3)
  })
})
