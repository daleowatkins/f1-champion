import { describe, it, expect } from 'vitest'
import { publicUrl } from '../src/lib/publicUrl'

describe('publicUrl', () => {
  it('prefixes paths with Vite base URL', () => {
    expect(publicUrl('data/spin-index.json')).toContain('data/spin-index.json')
    expect(publicUrl('/data/spin-index.json')).toContain('data/spin-index.json')
  })
})
