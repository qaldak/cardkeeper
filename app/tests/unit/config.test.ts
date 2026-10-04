import { describe, expect, it } from 'vitest'
import { resolve } from 'node:path'
import { loadConfig } from '../../server/lib/config'

describe('loadConfig', () => {
  it('uses documented defaults', () => {
    expect(loadConfig({})).toEqual({
      priceSource: 'cardmarket',
      imageDir: resolve('/data/card-images'),
      maxUploadBytes: 5 * 1024 * 1024,
      userHeader: 'x-remote-user',
      ygoBaseUrl: 'https://db.ygoprodeck.com/api/v7',
    })
  })

  it('reads overrides from the environment', () => {
    const config = loadConfig({
      PRICE_SOURCE: 'tcgplayer',
      IMAGE_DIR: '/tmp/images',
      MAX_UPLOAD_MB: '1.5',
      AUTH_USER_HEADER: 'X-Forwarded-User',
      YGOPRODECK_API_URL: 'http://localhost:9999/api',
    })
    expect(config).toMatchObject({
      priceSource: 'tcgplayer',
      imageDir: '/tmp/images',
      maxUploadBytes: 1.5 * 1024 * 1024,
      userHeader: 'x-forwarded-user',
      ygoBaseUrl: 'http://localhost:9999/api',
    })
  })

  it('rejects an invalid upload limit', () => {
    expect(() => loadConfig({ MAX_UPLOAD_MB: '0' })).toThrow(/MAX_UPLOAD_MB/)
    expect(() => loadConfig({ MAX_UPLOAD_MB: 'abc' })).toThrow(/MAX_UPLOAD_MB/)
  })
})
