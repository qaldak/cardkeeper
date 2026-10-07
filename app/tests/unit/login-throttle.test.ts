import { describe, expect, it } from 'vitest'
import { createLoginThrottle } from '../../server/lib/login-throttle'

function setup(maxFailures = 3) {
  let now = new Date('2026-10-07T10:00:00Z')
  const throttle = createLoginThrottle({ maxFailures, windowMs: 15 * 60 * 1000, now: () => now })
  return { throttle, advanceMinutes: (minutes: number) => { now = new Date(now.getTime() + minutes * 60_000) } }
}

describe('login throttle', () => {
  it('lets a name fail a few times and then blocks it', () => {
    const { throttle } = setup()
    for (let i = 0; i < 3; i++) {
      throttle.check('anna')
      throttle.fail('anna')
    }
    expect(() => throttle.check('anna')).toThrowError(expect.objectContaining({ status: 429, code: 'too_many_attempts' }))
  })

  it('counts every name for itself', () => {
    const { throttle } = setup()
    for (let i = 0; i < 3; i++) {
      throttle.fail('anna')
    }
    expect(() => throttle.check('max')).not.toThrow()
  })

  it('unblocks when the window is over', () => {
    const { throttle, advanceMinutes } = setup()
    for (let i = 0; i < 3; i++) {
      throttle.fail('anna')
    }
    advanceMinutes(14)
    expect(() => throttle.check('anna')).toThrow()
    advanceMinutes(2)
    expect(() => throttle.check('anna')).not.toThrow()
  })

  it('forgets the failures after a successful login', () => {
    const { throttle } = setup()
    throttle.fail('anna')
    throttle.fail('anna')
    throttle.reset('anna')
    throttle.fail('anna')
    expect(() => throttle.check('anna')).not.toThrow()
  })
})
