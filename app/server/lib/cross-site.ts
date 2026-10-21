const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

/**
 * Whether a request changes something and was sent by a page of another site (`Sec-Fetch-Site: cross-site`) or of
 * another origin of the same site such as a sibling subdomain (`same-site`): the cookie of a login would go along with
 * it (SameSite=Lax does not stop the second kind), so it is refused. The browser sets the header itself, and a page
 * cannot change it. Requests of the app's own pages say `same-origin`, address bar and bookmarks `none`; programs
 * (curl, scripts) send no header and carry no browser login to abuse. Browsers only send the header to https and
 * localhost, so over plain http in a home network the check does not apply and SameSite=Lax remains.
 */
export function isCrossSiteWrite(method: string, secFetchSite: string | undefined): boolean {
  return WRITE_METHODS.has(method.toUpperCase()) && (secFetchSite === 'cross-site' || secFetchSite === 'same-site')
}
