/**
 * The urls to try for an image, in order. TCGdex serves every asset as webp and png, but single files can be missing
 * in one format (a set symbol answers 400 although its logo exists), so the png is the second chance.
 */
export function imageCandidates(url: string): string[] {
  return url.endsWith('.webp') ? [url, `${url.slice(0, -'.webp'.length)}.png`] : [url]
}
