import type { SessionUserDto } from '#shared/types/api'
import { OVERVIEW_QUERY_COOKIE } from '#shared/utils/overview-query'

/** The HTTP status of a failed call, if it got an answer. */
export const statusOf = (error: unknown): number | undefined =>
  (error as { statusCode?: number, response?: { status?: number } })?.statusCode ?? (error as { response?: { status?: number } })?.response?.status

/** The logged in user of this browser. `undefined` means "not asked yet", `null` "not logged in". */
export function useAuth() {
  const user = useState<SessionUserDto | null | undefined>('auth-user', () => undefined)
  // On the server the request's own cookies have to be forwarded to the API.
  const requestFetch = useRequestFetch()
  // The overview starts with the defaults again after a login or logout.
  const forgetOverview = () => { useCookie(OVERVIEW_QUERY_COOKIE).value = null }

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
    forgetOverview()
    return user.value
  }

  /**
   * Ends the session and leaves nothing of the user in the browser: the state and every loaded answer are dropped, and the
   * sign-in page is loaded afresh (a full page load), so that nothing of the earlier pages can be reached or shown again.
   * `false` when the server could not be asked; then the session may still be valid and nothing is reset.
   */
  async function logout(): Promise<boolean> {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    }
    catch (error) {
      // 401: there was no valid session any more, which is what was wanted.
      if (statusOf(error) !== 401) {
        return false
      }
    }
    user.value = null
    forgetOverview()
    clearNuxtData()
    clearNuxtState()
    await navigateTo('/login', { external: true })
    return true
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    user.value = await $fetch<SessionUserDto>('/api/auth/password', { method: 'PUT', body: { currentPassword, newPassword } })
    return user.value
  }

  return { user, load, login, logout, changePassword }
}
