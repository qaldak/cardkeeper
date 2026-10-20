import { OVERVIEW_QUERY_COOKIE, rememberedQuery } from '#shared/utils/overview-query'

// A visit to the overview without any filter in the url (the "back to overview" link, the menu, a deleted card) shows
// it as it was left: the filters, sort order and page remembered in a session cookie. The first visit after a login
// has none, so the defaults apply (the logged in user as owner).
export default defineNuxtRouteMiddleware((to) => {
  if (to.path !== '/' || Object.keys(to.query).length > 0) {
    return
  }
  const query = rememberedQuery(useCookie<unknown>(OVERVIEW_QUERY_COOKIE).value)
  if (query) {
    return navigateTo({ path: '/', query }, { replace: true })
  }
})
