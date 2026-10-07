import type { SessionUserDto } from '#shared/types/api'

/** The logged in user of this browser. `undefined` means "not asked yet", `null` "not logged in". */
export function useAuth() {
  const user = useState<SessionUserDto | null | undefined>('auth-user', () => undefined)
  // On the server the request's own cookies have to be forwarded to the API.
  const requestFetch = useRequestFetch()

  async function load(force = false): Promise<SessionUserDto | null> {
    if (user.value !== undefined && !force) {
      return user.value
    }
    try {
      user.value = await requestFetch<SessionUserDto>('/api/auth/me')
    }
    catch {
      user.value = null
    }
    return user.value
  }

  async function login(name: string, password: string) {
    user.value = await $fetch<SessionUserDto>('/api/auth/login', { method: 'POST', body: { name, password } })
    return user.value
  }

  async function logout() {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    }
    finally {
      user.value = null
    }
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    user.value = await $fetch<SessionUserDto>('/api/auth/password', { method: 'PUT', body: { currentPassword, newPassword } })
    return user.value
  }

  return { user, load, login, logout, changePassword }
}
