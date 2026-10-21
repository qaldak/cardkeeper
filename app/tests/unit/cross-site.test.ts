import { describe, expect, it } from 'vitest'
import { isCrossSiteWrite } from '../../server/lib/cross-site'

describe('isCrossSiteWrite', () => {
  it('refuses writes from another site and from another origin of the same site', () => {
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'post']) {
      expect(isCrossSiteWrite(method, 'cross-site')).toBe(true)
      expect(isCrossSiteWrite(method, 'same-site')).toBe(true)
    }
  })

  it('allows the pages of the app itself, the address bar and programs', () => {
    expect(isCrossSiteWrite('POST', 'same-origin')).toBe(false)
    expect(isCrossSiteWrite('POST', 'none')).toBe(false)
    expect(isCrossSiteWrite('DELETE', undefined)).toBe(false)
  })

  it('leaves reads alone', () => {
    expect(isCrossSiteWrite('GET', 'cross-site')).toBe(false)
    expect(isCrossSiteWrite('HEAD', 'same-site')).toBe(false)
  })
})
