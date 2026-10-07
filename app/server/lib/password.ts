import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { INITIAL_PASSWORD } from '../../shared/utils/users'

// scrypt with the parameters recommended for interactive logins; the parameters are part of the stored value, so they
// can be raised later without invalidating existing hashes.
const N = 16384
const R = 8
const P = 1
const KEY_LENGTH = 64

const derive = (password: string, salt: Buffer, n: number, r: number, p: number, length: number) =>
  new Promise<Buffer>((resolve, reject) => {
    scrypt(password.normalize('NFKC'), salt, length, { N: n, r, p, maxmem: 128 * n * r * 2 }, (error, key) =>
      error ? reject(error) : resolve(key))
  })

/** `scrypt$N$r$p$salt$key` (base64), a self-describing hash. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const key = await derive(password, salt, N, R, P, KEY_LENGTH)
  return ['scrypt', N, R, P, salt.toString('base64'), key.toString('base64')].join('$')
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, n, r, p, salt, key] = stored.split('$')
  if (scheme !== 'scrypt' || !n || !r || !p || !salt || !key) {
    return false
  }
  const expected = Buffer.from(key, 'base64')
  const actual = await derive(password, Buffer.from(salt, 'base64'), Number(n), Number(r), Number(p), expected.length)
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

const digest = (value: string) => createHash('sha256').update(value).digest()

/** Compares with the initial password in constant time. */
export function isInitialPassword(password: string): boolean {
  return timingSafeEqual(digest(password), digest(INITIAL_PASSWORD))
}

/**
 * Changes whenever the password changes (or is reset). A session is only valid for the stamp it was created with, so a
 * password change or reset logs every other browser out.
 */
export function passwordStamp(passwordHash: string | null): string {
  return passwordHash === null ? 'initial' : createHash('sha256').update(passwordHash).digest('hex').slice(0, 16)
}
