import { describe, expect, it } from 'vitest'
import { hashPassword, isInitialPassword, passwordStamp, verifyPassword } from '../../server/lib/password'
import { INITIAL_PASSWORD, passwordProblem } from '../../shared/utils/users'

describe('password hashing', () => {
  it('verifies the password a hash was made from, and no other', async () => {
    const hash = await hashPassword('correct horse battery')
    expect(await verifyPassword('correct horse battery', hash)).toBe(true)
    expect(await verifyPassword('correct horse batterz', hash)).toBe(false)
    expect(await verifyPassword('', hash)).toBe(false)
  })

  it('stores a self-describing hash with a salt of its own', async () => {
    const a = await hashPassword('same password')
    const b = await hashPassword('same password')
    expect(a).toMatch(/^scrypt\$16384\$8\$1\$[^$]+\$[^$]+$/)
    expect(a).not.toBe(b)
    expect(a).not.toContain('same password')
  })

  it('treats equivalent unicode spellings of a password as the same', async () => {
    const hash = await hashPassword('Café geheim')
    expect(await verifyPassword('Café geheim', hash)).toBe(true)
  })

  it('rejects hashes it does not understand', async () => {
    expect(await verifyPassword('x', '')).toBe(false)
    expect(await verifyPassword('x', 'plaintext')).toBe(false)
    expect(await verifyPassword('x', 'bcrypt$1$2$3$4$5')).toBe(false)
    expect(await verifyPassword('x', 'scrypt$16384$8$1$')).toBe(false)
  })
})

describe('initial password', () => {
  it('is recognized exactly', () => {
    expect(isInitialPassword(INITIAL_PASSWORD)).toBe(true)
    expect(isInitialPassword('Cardkeeper')).toBe(false)
    expect(isInitialPassword('cardkeeper ')).toBe(false)
    expect(isInitialPassword('')).toBe(false)
  })
})

describe('passwordStamp', () => {
  it('differs for every hash and for the initial state', async () => {
    const a = passwordStamp(await hashPassword('one password'))
    const b = passwordStamp(await hashPassword('one password'))
    expect(passwordStamp(null)).toBe('initial')
    expect(new Set([a, b, 'initial']).size).toBe(3)
  })

  it('stays the same for the same hash', () => {
    expect(passwordStamp('scrypt$1$2$3$a$b')).toBe(passwordStamp('scrypt$1$2$3$a$b'))
  })
})

describe('passwordProblem', () => {
  it('accepts a long enough password that is not the initial one', () => {
    expect(passwordProblem('12345678')).toBeNull()
    expect(passwordProblem('a much longer pass phrase')).toBeNull()
  })

  it('names what is wrong', () => {
    expect(passwordProblem('short')).toBe('too_short')
    expect(passwordProblem('x'.repeat(201))).toBe('too_long')
    expect(passwordProblem('cardkeeper')).toBe('initial')
    expect(passwordProblem('CardKeeper')).toBe('initial')
  })
})
