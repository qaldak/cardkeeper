import { forbidden, unauthorized } from '../lib/errors'
import { isPublicPath } from '../lib/public-paths'

// Everything below /api needs a login, except the few public paths (see `isPublicPath`). A user who still has to choose a
// password may only reach the password change (and log out or look who they are).
const WHILE_PASSWORD_CHANGE_REQUIRED = new Set(['/api/auth/me', '/api/auth/password', '/api/auth/logout'])

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname
  if (isPublicPath(path)) {
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
