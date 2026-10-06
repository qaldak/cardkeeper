/** Returns the URL if it is HTTPS on one of the allowed hosts, otherwise null. */
export function allowedImageUrl(url: string | null | undefined, hosts: readonly string[]): string | null {
  if (!url) {
    return null
  }
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && hosts.includes(parsed.hostname) ? url : null
  }
  catch {
    return null
  }
}
