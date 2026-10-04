export interface DownloadOptions {
  allowedHosts: readonly string[]
  maxBytes: number
  timeoutMs?: number
  fetchFn?: typeof fetch
}

/**
 * Downloads an image from an adapter supplied URL. Only HTTPS URLs on explicitly allowed hosts are
 * fetched, and the body is capped, so a manipulated API response cannot make the server fetch
 * arbitrary internal addresses or huge files.
 */
export async function downloadImage(url: string, options: DownloadOptions): Promise<Uint8Array> {
  const parsed = new URL(url)
  if (parsed.protocol !== 'https:' || !options.allowedHosts.includes(parsed.hostname)) {
    throw new Error(`Image host not allowed: ${parsed.hostname}`)
  }

  const fetchFn = options.fetchFn ?? fetch
  const response = await fetchFn(parsed, {
    signal: AbortSignal.timeout(options.timeoutMs ?? 15_000),
    redirect: 'error',
  })
  if (!response.ok || !response.body) {
    throw new Error(`Image download failed with status ${response.status}`)
  }

  const declaredLength = Number(response.headers.get('content-length') ?? 0)
  if (declaredLength > options.maxBytes) {
    throw new Error('Image is too large')
  }

  const chunks: Uint8Array[] = []
  let received = 0
  for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) {
    received += chunk.length
    if (received > options.maxBytes) {
      throw new Error('Image is too large')
    }
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}
