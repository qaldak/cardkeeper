import { describe, expect, it } from 'vitest'
import { hashPassword } from '../../server/lib/password'
import { TEST_DATABASE_URL, useHarness } from './helpers'

describe.skipIf(!TEST_DATABASE_URL)('user service', () => {
  const h = useHarness()

  describe('ensure', () => {
    it('creates the missing users with the initial password and leaves the others alone', async () => {
      expect(await h.services.users.ensure(['Anna', 'Max', 'Lena'])).toEqual(['Max', 'Lena'])
      expect((await h.services.users.list()).map(user => user.name)).toEqual(['Anna', 'Lena', 'Max', 'Sven'])
      expect(await h.db.user.findMany({ where: { name: { in: ['Max', 'Lena'] } }, select: { passwordHash: true } })).toEqual([{ passwordHash: null }, { passwordHash: null }])
    })

    it('ignores the case, so a name is not created twice', async () => {
      expect(await h.services.users.ensure(['anna', 'SVEN'])).toEqual([])
      expect(await h.services.users.count()).toBe(2)
    })

    it('keeps users (and their cards) that disappear from the list', async () => {
      await h.services.users.ensure(['Max'])
      await h.services.users.ensure([])
      expect(await h.services.users.count()).toBe(3)
    })
  })

  describe('login', () => {
    it('accepts the initial password of a user without a password and asks to change it', async () => {
      const user = await h.services.users.login('Anna', 'cardkeeper')
      expect(user).toMatchObject({ id: h.anna.id, name: 'Anna', mustChangePassword: true, stamp: 'initial' })
    })

    it('ignores the case and the surrounding spaces of the name', async () => {
      expect((await h.services.users.login('  aNNa ', 'cardkeeper')).id).toBe(h.anna.id)
    })

    it('answers a wrong password and an unknown name the same way', async () => {
      await expect(h.services.users.login('Anna', 'wrong')).rejects.toMatchObject({ status: 401, code: 'invalid_credentials' })
      await expect(h.services.users.login('Nobody', 'cardkeeper')).rejects.toMatchObject({ status: 401, code: 'invalid_credentials' })
    })

    it('blocks a name after too many failures, even for the right password', async () => {
      for (let i = 0; i < 10; i++) {
        await expect(h.services.users.login('Anna', 'wrong')).rejects.toMatchObject({ status: 401 })
      }
      await expect(h.services.users.login('Anna', 'cardkeeper')).rejects.toMatchObject({ status: 429, code: 'too_many_attempts' })
      expect((await h.services.users.login('Sven', 'cardkeeper')).name).toBe('Sven')
    })

    it('does not accept the initial password once an own password is set', async () => {
      await h.db.user.update({ where: { id: h.anna.id }, data: { passwordHash: await hashPassword('my own password') } })
      await expect(h.services.users.login('Anna', 'cardkeeper')).rejects.toMatchObject({ code: 'invalid_credentials' })
      expect(await h.services.users.login('Anna', 'my own password')).toMatchObject({ mustChangePassword: false })
    })
  })

  describe('change password', () => {
    it('sets the own password, which then replaces the initial one', async () => {
      const changed = await h.services.users.changePassword(h.anna.id, 'cardkeeper', 'a new password')
      expect(changed.mustChangePassword).toBe(false)
      expect((await h.db.user.findUniqueOrThrow({ where: { id: h.anna.id } })).passwordHash).toMatch(/^scrypt\$/)
      await expect(h.services.users.login('Anna', 'cardkeeper')).rejects.toMatchObject({ code: 'invalid_credentials' })
      expect((await h.services.users.login('Anna', 'a new password')).id).toBe(h.anna.id)
    })

    it('needs the current password', async () => {
      await expect(h.services.users.changePassword(h.anna.id, 'wrong', 'a new password')).rejects.toMatchObject({ status: 400, code: 'current_password_wrong' })
    })

    it('rejects a new password that is too short, the initial one, or unchanged', async () => {
      await expect(h.services.users.changePassword(h.anna.id, 'cardkeeper', 'short')).rejects.toMatchObject({ code: 'password_too_short' })
      await expect(h.services.users.changePassword(h.anna.id, 'cardkeeper', 'CARDKEEPER')).rejects.toMatchObject({ code: 'password_initial' })
      await h.services.users.changePassword(h.anna.id, 'cardkeeper', 'first password')
      await expect(h.services.users.changePassword(h.anna.id, 'first password', 'first password')).rejects.toMatchObject({ code: 'password_unchanged' })
      expect((await h.db.user.findUniqueOrThrow({ where: { id: h.anna.id } })).passwordHash).not.toBeNull()
    })
  })

  describe('sessions', () => {
    it('are valid for the password state they were created in', async () => {
      const first = await h.services.users.login('Anna', 'cardkeeper')
      expect(await h.services.users.fromSession(h.anna.id, first.stamp)).toMatchObject({ name: 'Anna', mustChangePassword: true })

      const changed = await h.services.users.changePassword(h.anna.id, 'cardkeeper', 'a new password')
      expect(await h.services.users.fromSession(h.anna.id, first.stamp)).toBeNull()
      expect(await h.services.users.fromSession(h.anna.id, changed.stamp)).toMatchObject({ mustChangePassword: false })
    })

    it('end when the operator resets the password in the database', async () => {
      const changed = await h.services.users.changePassword(h.anna.id, 'cardkeeper', 'a new password')
      await h.db.$executeRawUnsafe(`UPDATE users SET password_hash = NULL WHERE name = 'Anna'`)

      expect(await h.services.users.fromSession(h.anna.id, changed.stamp)).toBeNull()
      const again = await h.services.users.login('Anna', 'cardkeeper')
      expect(again).toMatchObject({ mustChangePassword: true, stamp: 'initial' })
      await expect(h.services.users.login('Anna', 'a new password')).rejects.toMatchObject({ code: 'invalid_credentials' })
    })

    it('end when the user is gone or the stamp is missing', async () => {
      expect(await h.services.users.fromSession(99999, 'initial')).toBeNull()
      expect(await h.services.users.fromSession(h.anna.id, undefined)).toBeNull()
    })
  })

  describe('list', () => {
    it('shows every user with the number of their cards', async () => {
      await h.services.cards.create({ game: 'ygo', externalId: '46986414' }, h.anna)
      expect(await h.services.users.list()).toEqual([
        { id: h.anna.id, name: 'Anna', cardCount: 1 },
        { id: h.sven.id, name: 'Sven', cardCount: 0 },
      ])
    })
  })
})
