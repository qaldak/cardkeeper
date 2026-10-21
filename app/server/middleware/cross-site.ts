import { forbidden } from '../lib/errors'
import { isCrossSiteWrite } from '../lib/cross-site'

// Defence in depth against cross-site request forgery next to the SameSite=Lax login cookie, see isCrossSiteWrite.
export default defineEventHandler((event) => {
  if (getRequestURL(event).pathname.startsWith('/api/') && isCrossSiteWrite(event.method, getRequestHeader(event, 'sec-fetch-site'))) {
    throw toH3Error(forbidden('cross_site_request', 'Requests from other sites are not allowed'))
  }
})
