import { forbidden, unauthorized } from '../lib/errors'

// Everything below /api needs a login, except the health check (Docker) and the login itself. A user who still has to
// choose a password may only reach the password change (and log out or look who they are).
const PUBLIC = new Set(['/api/health', '/api/auth/login'])
// The icon data the pages load (the same for everybody, nothing of the collection).
const PUBLIC_PREFIXES = ['/api/_nuxt_icon/']
const WHILE_PASSWORD_CHANGE_REQUIRED = new Set(['/api/auth/me', '/api/auth/password', '/api/auth/logout'])

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname
  if (!path.startsWith('/api/') || PUBLIC.has(path) || PUBLIC_PREFIXES.some(prefix => path.startsWith(prefix))) {
    return
  }
  try {
    const user = await currentUser(event)
    if (!user) {
      throw unauthorized('unauthenticated', 'Login required')
    }
    if (user.mustChangePassword && !WHILE_PASSWORD_CHANGE_REQUIRED.has(path)) {
      throw forbidden('password_change_required', 'Choose a new password first')
    }
  }
  catch (error) {
    throw toH3Error(error)
  }
})
