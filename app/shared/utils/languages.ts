// Card texts are downloaded in these languages, in order of preference.
export const CARD_LANGUAGES = ['de', 'en'] as const

export type CardLanguage = (typeof CARD_LANGUAGES)[number]

/** German if available, otherwise English, otherwise the first available language. */
export function preferredLanguage(available: readonly string[]): string | null {
  for (const language of CARD_LANGUAGES) {
    if (available.includes(language)) {
      return language
    }
  }
  return available[0] ?? null
}

/** Sorts languages by preference (German, English, then the rest alphabetically). */
export function sortByLanguagePreference<T extends { language: string }>(items: readonly T[]): T[] {
  const rank = (language: string) => {
    const index = (CARD_LANGUAGES as readonly string[]).indexOf(language)
    return index === -1 ? CARD_LANGUAGES.length : index
  }
  return [...items].sort((a, b) => rank(a.language) - rank(b.language) || a.language.localeCompare(b.language))
}
