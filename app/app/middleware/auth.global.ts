// Every page needs a login, and a user who still has the initial password can only reach the password change.
// The session is asked again on each navigation in the browser, so an expired session leads to the login page.
export default defineNuxtRouteMiddleware(async (to, from) => {
  const user = await useAuth().load(import.meta.client && !!from)

  if (!user) {
    return to.path === '/login' ? undefined : navigateTo({ path: '/login', query: to.path === '/' ? undefined : { next: to.fullPath } })
  }
  if (user.mustChangePassword) {
    return to.path === '/account' ? undefined : navigateTo('/account')
  }
  if (to.path === '/login') {
    return navigateTo('/')
  }
})
