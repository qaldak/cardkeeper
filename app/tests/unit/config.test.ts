import { describe, expect, it } from 'vitest'
import { resolve } from 'node:path'
import { loadConfig } from '../../server/lib/config'

const SECRET = 'x'.repeat(32)
const env = (extra: Record<string, string> = {}) => ({ SESSION_SECRET: SECRET, ...extra })

describe('loadConfig', () => {
  it('uses documented defaults', () => {
    expect(loadConfig(env())).toEqual({
      priceSource: 'cardmarket',
      imageDir: resolve('/data/card-images'),
      maxUploadBytes: 5 * 1024 * 1024,
      sessionSecret: SECRET,
      users: [],
      ygoBaseUrl: 'https://db.ygoprodeck.com/api/v7',
      tcgdexBaseUrl: 'https://api.tcgdex.net/v2',
    })
  })

  it('reads overrides from the environment', () => {
    const config = loadConfig(env({
      PRICE_SOURCE: 'tcgplayer',
      IMAGE_DIR: '/tmp/images',
      MAX_UPLOAD_MB: '1.5',
      USERS: 'anna, Max,sven',
      YGOPRODECK_API_URL: 'http://localhost:9999/api',
      TCGDEX_API_URL: 'http://localhost:9998/v2',
    }))
    expect(config).toMatchObject({
      priceSource: 'tcgplayer',
      imageDir: '/tmp/images',
      maxUploadBytes: 1.5 * 1024 * 1024,
      users: ['anna', 'Max', 'sven'],
      ygoBaseUrl: 'http://localhost:9999/api',
      tcgdexBaseUrl: 'http://localhost:9998/v2',
    })
  })

  it('rejects an invalid upload limit', () => {
    expect(() => loadConfig(env({ MAX_UPLOAD_MB: '0' }))).toThrow(/MAX_UPLOAD_MB/)
    expect(() => loadConfig(env({ MAX_UPLOAD_MB: 'abc' }))).toThrow(/MAX_UPLOAD_MB/)
  })

  it('needs a long enough session secret', () => {
    expect(() => loadConfig({})).toThrow(/SESSION_SECRET/)
    expect(() => loadConfig({ SESSION_SECRET: 'short' })).toThrow(/SESSION_SECRET/)
    expect(() => loadConfig({ SESSION_SECRET: `  ${SECRET}  ` })).not.toThrow()
  })

  it('reads the users, ignoring blanks and names that appear twice', () => {
    expect(loadConfig(env({ USERS: ' anna ,, Anna,max,' })).users).toEqual(['anna', 'max'])
    expect(loadConfig(env({ USERS: '' })).users).toEqual([])
  })

  it('rejects a user name with unusual characters', () => {
    expect(() => loadConfig(env({ USERS: 'anna,<b>' }))).toThrow(/USERS/)
  })
})
