import { describe, expect, it } from 'vitest'
import { aiExportQuerySchema } from '../../server/lib/schemas'

describe('query of the text for an AI', () => {
  it('has the option "only cards for the deck" on by default, like "only active cards"', () => {
    const parsed = aiExportQuerySchema.parse({})
    expect(parsed.deckOnly).toBe(true)
    expect(parsed.onlyActive).toBe(true)
  })

  it('takes true and false, and nothing else', () => {
    expect(aiExportQuerySchema.parse({ deckOnly: 'false' }).deckOnly).toBe(false)
    expect(aiExportQuerySchema.parse({ deckOnly: 'true' }).deckOnly).toBe(true)
    expect(() => aiExportQuerySchema.parse({ deckOnly: 'maybe' })).toThrow()
    expect(() => aiExportQuerySchema.parse({ deckOnly: '1' })).toThrow()
  })
})
