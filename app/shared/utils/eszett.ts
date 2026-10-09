// In Switzerland "ß" is written "ss" ("weisser" for "weißer"), but the card databases keep the German spelling. A
// search therefore has to find "ß" when "ss" is typed (and the other way round).

/** The most spellings that are searched for one text: with three "ss" or "ß" that is every combination. */
const MAX_OCCURRENCES = 3

/**
 * The spellings of a search text with "ss" and "ß" exchanged, the typed one first. Every "ss"/"ß" can be either, so a
 * text with one of them gives two spellings, with two of them four. Above three occurrences only the typed text, all
 * "ß" and all "ss" are tried, to keep the number of requests small. A text without any is returned as it is.
 */
export function eszettVariants(text: string): string[] {
  const parts = text.split(/(ss|ß)/i)
  // The odd parts are the matches ("ss", "SS", "ß"), the even ones the text around them.
  const matches = parts.filter((_, index) => index % 2 === 1)
  if (matches.length === 0) {
    return [text]
  }
  const build = (choose: (index: number) => 'ss' | 'ß') => {
    let index = -1
    return parts.map((part, position) => (position % 2 === 1 ? choose(++index) : part)).join('')
  }
  const variants = new Set<string>([text])
  if (matches.length > MAX_OCCURRENCES) {
    variants.add(build(() => 'ß'))
    variants.add(build(() => 'ss'))
    return [...variants]
  }
  for (let mask = 1; mask < 2 ** matches.length; mask += 1) {
    // The spelling that was typed stays where its bit is 0, the other one is used where it is 1.
    variants.add(build(index => ((mask >> index) & 1) === 1
      ? (matches[index]!.toLowerCase() === 'ss' ? 'ß' : 'ss')
      : (matches[index]!.toLowerCase() === 'ss' ? 'ss' : 'ß')))
  }
  return [...variants]
}

/** Lower case with "ß" written "ss": compares texts regardless of which spelling either one uses. */
export const foldEszett = (text: string): string => text.toLowerCase().replace(/ß/g, 'ss').replace(/ẞ/g, 'ss')
