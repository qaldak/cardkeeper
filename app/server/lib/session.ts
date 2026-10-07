import { getCookie, getRequestProtocol, unsealSession, useSession, clearSession, type H3Event, type SessionConfig } from 'h3'

export const SESSION_COOKIE = 'cardkeeper-session'
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60

export interface SessionData {
  /** The logged in user. */
  uid?: number
  /** `passwordStamp` of the user at login; a different stamp means the password changed since. */
  stamp?: string
}

// The session is a sealed (encrypted and signed) cookie: nothing is stored on the server. The `secure` flag follows the
// protocol the browser used, which the reverse proxy reports in X-Forwarded-Proto; otherwise a login over plain http
// (e.g. in a home network without certificate) would silently not stick.
const configFor = (event: H3Event, secret: string): SessionConfig => ({
  password: secret,
  name: SESSION_COOKIE,
  maxAge: MAX_AGE_SECONDS,
  sessionHeader: false,
  cookie: { httpOnly: true, sameSite: 'lax', path: '/', secure: getRequestProtocol(event) === 'https' },
})

/** The data of the session cookie of this request, or null without a valid one. Never sets a cookie. */
export async function readSession(event: H3Event, secret: string): Promise<SessionData | null> {
  const token = getCookie(event, SESSION_COOKIE)
  if (!token) {
    return null
  }
  try {
    const session = await unsealSession(event, configFor(event, secret), token)
    return (session.data as SessionData | undefined) ?? null
  }
  catch {
    return null
  }
}

export async function startSession(event: H3Event, secret: string, data: Required<SessionData>): Promise<void> {
  const session = await useSession<SessionData>(event, configFor(event, secret))
  await session.update(data)
}

export async function endSession(event: H3Event, secret: string): Promise<void> {
  await clearSession(event, configFor(event, secret))
}
