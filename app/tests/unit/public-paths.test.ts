import { describe, expect, it } from 'vitest'
import { isPublicPath } from '../../server/lib/public-paths'

describe('paths outside the login', () => {
  it('lets the health check, the login and the logout through', () => {
    expect(isPublicPath('/api/health')).toBe(true)
    expect(isPublicPath('/api/auth/login')).toBe(true)
    // Ending a session must work when the session is already dead.
    expect(isPublicPath('/api/auth/logout')).toBe(true)
  })

  it('lets the icon data and the pages through (the pages ask the API themselves)', () => {
    expect(isPublicPath('/api/_nuxt_icon/lucide.json')).toBe(true)
    expect(isPublicPath('/')).toBe(true)
    expect(isPublicPath('/cards/5')).toBe(true)
  })

  it('keeps everything else of the API behind the login', () => {
    for (const path of ['/api/cards', '/api/cards/1', '/api/auth/me', '/api/auth/password', '/api/users', '/api/export/ai', '/api/healthz', '/api/auth/logout/other']) {
      expect(isPublicPath(path), path).toBe(false)
    }
  })
})
