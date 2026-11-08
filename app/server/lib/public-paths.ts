// The paths below /api that need no login. Signing out is one of them: it only ends the session in the browser, so it has to
// work when the session is already invalid (expired, or ended by a password change elsewhere); otherwise a browser could not
// get rid of a dead session.
const PUBLIC = new Set(['/api/health', '/api/auth/login', '/api/auth/logout'])
// The icon data the pages load (the same for everybody, nothing of the collection).
const PUBLIC_PREFIXES = ['/api/_nuxt_icon/']

/** Whether a request path is outside the login: anything that is not below /api/, and the few public API paths. */
export function isPublicPath(path: string): boolean {
  return !path.startsWith('/api/') || PUBLIC.has(path) || PUBLIC_PREFIXES.some(prefix => path.startsWith(prefix))
}
