import type { PrismaClient } from '../generated/prisma/client'
import type { UserDto } from '../../shared/types/api'
import { passwordProblem } from '../../shared/utils/users'
import { badRequest, unauthorized } from '../lib/errors'
import { createLoginThrottle } from '../lib/login-throttle'
import { hashPassword, isInitialPassword, passwordStamp, verifyPassword } from '../lib/password'

/** A user as the session sees them. */
export interface SessionUser {
  id: number
  name: string
  /** True until the user has chosen their own password (a NULL hash means the initial password). */
  mustChangePassword: boolean
  /** See `passwordStamp`. */
  stamp: string
}

export interface UserServiceDeps {
  db: PrismaClient
  now?: () => Date
}

const toSessionUser = (user: { id: number, name: string, passwordHash: string | null }): SessionUser => ({
  id: user.id,
  name: user.name,
  mustChangePassword: user.passwordHash === null,
  stamp: passwordStamp(user.passwordHash),
})

// Verified against when the name is unknown, so that an unknown name takes as long as a wrong password.
let dummyHash: Promise<string> | undefined

async function matches(password: string, passwordHash: string | null | undefined): Promise<boolean> {
  if (passwordHash === undefined) {
    dummyHash ??= hashPassword('not a password of anybody')
    await verifyPassword(password, await dummyHash)
    return false
  }
  return passwordHash === null ? isInitialPassword(password) : verifyPassword(password, passwordHash)
}

export function createUserService({ db, now }: UserServiceDeps) {
  const throttle = createLoginThrottle({ now })

  const findByName = (name: string) =>
    db.user.findFirst({ where: { name: { equals: name.trim(), mode: 'insensitive' } } })

  return {
    async list(): Promise<UserDto[]> {
      const users = await db.user.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, _count: { select: { cards: true } } },
      })
      return users.map(user => ({ id: user.id, name: user.name, cardCount: user._count.cards }))
    },

    /**
     * Creates the users that do not exist yet (compared without regard to the case) with the initial password and
     * returns their names. Names that disappear from the list are left alone: neither the account nor its cards go away.
     */
    async ensure(names: readonly string[]): Promise<string[]> {
      const created: string[] = []
      for (const name of names) {
        if (!(await findByName(name))) {
          await db.user.create({ data: { name } })
          created.push(name)
        }
      }
      return created
    },

    async count(): Promise<number> {
      return db.user.count()
    },

    async login(name: string, password: string): Promise<SessionUser> {
      const key = name.trim().toLowerCase()
      throttle.check(key)
      const user = await findByName(name)
      if (!(await matches(password, user ? user.passwordHash : undefined)) || !user) {
        throttle.fail(key)
        throw unauthorized('invalid_credentials', 'Wrong user name or password')
      }
      throttle.reset(key)
      return toSessionUser(user)
    },

    /** The user of a session, or null when the user is gone or the password changed since the login. */
    async fromSession(id: number, stamp: string | undefined): Promise<SessionUser | null> {
      const user = await db.user.findUnique({ where: { id }, select: { id: true, name: true, passwordHash: true } })
      if (!user) {
        return null
      }
      const sessionUser = toSessionUser(user)
      return sessionUser.stamp === stamp ? sessionUser : null
    },

    async changePassword(id: number, currentPassword: string, newPassword: string): Promise<SessionUser> {
      const user = await db.user.findUnique({ where: { id }, select: { id: true, name: true, passwordHash: true } })
      if (!user) {
        throw unauthorized('invalid_credentials', 'Not logged in')
      }
      const key = user.name.toLowerCase()
      throttle.check(key)
      if (!(await matches(currentPassword, user.passwordHash))) {
        throttle.fail(key)
        throw badRequest('current_password_wrong', 'The current password is wrong')
      }
      const problem = passwordProblem(newPassword)
      if (problem) {
        throw badRequest(`password_${problem}`, 'The new password is not acceptable')
      }
      if (newPassword === currentPassword) {
        throw badRequest('password_unchanged', 'The new password must differ from the current one')
      }
      const updated = await db.user.update({
        where: { id },
        data: { passwordHash: await hashPassword(newPassword) },
        select: { id: true, name: true, passwordHash: true },
      })
      throttle.reset(key)
      return toSessionUser(updated)
    },
  }
}

export type UserService = ReturnType<typeof createUserService>
