// Another tab of the same browser can sign out (or the session can end: it expired, or the password was changed elsewhere)
// while this page is still shown. When the page becomes visible again it asks whether the session is still valid, and leads
// to the sign-in page, loaded afresh, if it is not. Only a clear "no" counts: a failed network call changes nothing.
export default defineNuxtPlugin(() => {
  let checking = false

  async function check() {
    const user = useAuth().user.value
    if (checking || document.visibilityState !== 'visible' || !user || location.pathname === '/login') {
      return
    }
    checking = true
    try {
      await $fetch('/api/auth/me')
    }
    catch (error) {
      if (statusOf(error) === 401) {
        const next = location.pathname === '/' ? '' : `?next=${encodeURIComponent(location.pathname + location.search)}`
        clearNuxtData()
        clearNuxtState()
        await navigateTo(`/login${next}`, { external: true })
      }
    }
    finally {
      checking = false
    }
  }

  document.addEventListener('visibilitychange', check)
  window.addEventListener('focus', check)
})
