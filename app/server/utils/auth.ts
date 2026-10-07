import type { H3Event } from 'h3'
import { unauthorized } from '../lib/errors'
import { readSession, SESSION_COOKIE } from '../lib/session'
import type { SessionUser } from '../services/users'

declare module 'h3' {
  interface H3EventContext {
    /** Set by the auth middleware: the logged in user, or null. */
    user?: SessionUser | null
  }
}

export { SESSION_COOKIE }

/** The user of the session cookie of this request (loaded once per request), or null. */
export async function currentUser(event: H3Event): Promise<SessionUser | null> {
  if (event.context.user !== undefined) {
    return event.context.user
  }
  const services = useServices()
  const session = await readSession(event, services.config.sessionSecret)
  const user = session?.uid ? await services.users.fromSession(session.uid, session.stamp) : null
  event.context.user = user
  return user
}

export async function requireUser(event: H3Event): Promise<SessionUser> {
  const user = await currentUser(event)
  if (!user) {
    throw unauthorized('unauthenticated', 'Login required')
  }
  return user
}
