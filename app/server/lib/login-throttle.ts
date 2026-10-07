import { HttpError } from './errors'

export interface ThrottleOptions {
  maxFailures?: number
  windowMs?: number
  now?: () => Date
}

/**
 * Limits failed logins per user name: after too many failures within the window the name is blocked until the window
 * is over. The initial password is public, so without a limit it could simply be guessed for every other name.
 * (Per name, not per address: behind the reverse proxy every request comes from the same address.)
 */
export function createLoginThrottle({ maxFailures = 10, windowMs = 15 * 60 * 1000, now = () => new Date() }: ThrottleOptions = {}) {
  const failures = new Map<string, { count: number, since: number }>()

  const current = (key: string) => {
    const entry = failures.get(key)
    if (entry && now().getTime() - entry.since >= windowMs) {
      failures.delete(key)
      return undefined
    }
    return entry
  }

  return {
    /** Throws 429 while the name is blocked. */
    check(key: string): void {
      const entry = current(key)
      if (entry && entry.count >= maxFailures) {
        throw new HttpError(429, 'too_many_attempts', 'Too many failed logins, try again later')
      }
    },
    fail(key: string): void {
      const entry = current(key)
      if (failures.size > 1000) {
        for (const stale of [...failures.keys()].filter(name => !current(name))) {
          failures.delete(stale)
        }
      }
      failures.set(key, { count: (entry?.count ?? 0) + 1, since: entry?.since ?? now().getTime() })
    },
    reset(key: string): void {
      failures.delete(key)
    },
  }
}
